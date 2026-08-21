/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
} from '@google/genai';
import EventEmitter from 'eventemitter3';
import { DEFAULT_LIVE_API_MODEL } from './constants';
import { difference } from 'lodash';
import { base64ToArrayBuffer } from './utils';

/**
 * Represents a single log entry in the system.
 * Used for tracking and displaying system events, messages, and errors.
 */
export interface StreamingLog {
  // Optional count for repeated log entries
  count?: number;
  // Optional additional data associated with the log
  data?: unknown;
  // Timestamp of when the log was created
  date: Date;
  // The log message content
  message: string | object;
  // The type/category of the log entry
  type: string;
}

/**
 * Event types that can be emitted by the MultimodalLiveClient.
 * Each event corresponds to a specific message from GenAI or client state change.
 */
export interface LiveClientEventTypes {
  // Emitted when audio data is received
  audio: (data: ArrayBuffer) => void;
  // Emitted when the connection closes
  close: (event: CloseEvent) => void;
  // Emitted when content is received from the server
  content: (data: LiveServerContent) => void;
  // Emitted when an error occurs
  error: (e: ErrorEvent) => void;
  // Emitted when the server interrupts the current generation
  interrupted: () => void;
  // Emitted for logging events
  log: (log: StreamingLog) => void;
  // Emitted when the connection opens
  open: () => void;
  // Emitted when the initial setup is complete
  setupcomplete: () => void;
  // Emitted when a tool call is received
  toolcall: (toolCall: LiveServerToolCall) => void;
  // Emitted when a tool call is cancelled
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation
  ) => void;
  // Emitted when the current turn is complete
  turncomplete: () => void;
}

export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  public readonly model: string = DEFAULT_LIVE_API_MODEL;

  protected readonly client: GoogleGenAI;
  protected session?: Session;

  private _status: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private _isManualDisconnect: boolean = false;
  public get status() {
    return this._status;
  }

  /**
   * Creates a new GenAILiveClient instance.
   * @param apiKey - API key for authentication with Google GenAI
   * @param model - Optional model name to override the default model
   */
  constructor(apiKey: string, model?: string) {
    super();
    if (model) this.model = model;

    this.client = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  public async connect(config: LiveConnectConfig): Promise<boolean> {
    if (this._status === 'connected' || this._status === 'connecting') {
      return false;
    }

    this._isManualDisconnect = false;
    this._status = 'connecting';
    const callbacks: LiveCallbacks = {
      onopen: this.onOpen.bind(this),
      onmessage: this.onMessage.bind(this),
      onerror: this.onError.bind(this),
      onclose: this.onClose.bind(this),
    };

    try {
      this.session = await this.client.live.connect({
        model: this.model,
        config: {
          ...config,
        },
        callbacks,
      });
    } catch (e: any) {
      console.error('Error connecting to GenAI Live:', e);
      this._status = 'disconnected';
      this.session = undefined;
      let errorMsg = e?.message || 'Connection error';
      if (errorMsg.includes('permission') || errorMsg.includes('403') || errorMsg.includes('API key')) {
        errorMsg = 'Permission denied / Invalid API key. Please check your Google AI Studio API key in Settings.';
      }
      this.emit('error', new ErrorEvent('error', { message: errorMsg }));
      return false;
    }

    this._status = 'connected';
    return true;
  }

  public disconnect() {
    this._isManualDisconnect = true;
    this.session?.close();
    this.session = undefined;
    this._status = 'disconnected';

    this.log('client.close', `Disconnected`);
    return true;
  }

  public send(parts: Part | Part[], turnComplete: boolean = true) {
    if (this._status !== 'connected' || !this.session) {
      return;
    }
    try {
      this.session.sendClientContent({ turns: parts, turnComplete });
      this.log(`client.send`, parts);
    } catch (err) {
      console.warn('sendClientContent error:', err);
    }
  }

  public sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    if (this._status !== 'connected' || !this.session) {
      return;
    }
    try {
      chunks.forEach(chunk => {
        this.session?.sendRealtimeInput({ media: chunk });
      });

      let hasAudio = false;
      let hasVideo = false;
      for (let i = 0; i < chunks.length; i++) {
        const ch = chunks[i];
        if (ch.mimeType.includes('audio')) hasAudio = true;
        if (ch.mimeType.includes('image')) hasVideo = true;
        if (hasAudio && hasVideo) break;
      }

      let message = 'unknown';
      if (hasAudio && hasVideo) message = 'audio + video';
      else if (hasAudio) message = 'audio';
      else if (hasVideo) message = 'video';
      this.log(`client.realtimeInput`, message);
    } catch (err) {
      console.warn('sendRealtimeInput error:', err);
    }
  }

  public sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (this._status !== 'connected' || !this.session) {
      return;
    }
    try {
      if (
        toolResponse.functionResponses &&
        toolResponse.functionResponses.length
      ) {
        this.session.sendToolResponse({
          functionResponses: toolResponse.functionResponses!,
        });
      }

      this.log(`client.toolResponse`, { toolResponse });
    } catch (err) {
      console.warn('sendToolResponse error:', err);
    }
  }

  protected onMessage(message: LiveServerMessage) {
    if (message.setupComplete) {
      this.emit('setupcomplete');
      return;
    }
    if (message.toolCall) {
      this.log('server.toolCall', message);
      this.emit('toolcall', message.toolCall);
      return;
    }
    if (message.toolCallCancellation) {
      this.log('receive.toolCallCancellation', message);
      this.emit('toolcallcancellation', message.toolCallCancellation);
      return;
    }

    if (message.serverContent) {
      const { serverContent } = message;
      if ('interrupted' in serverContent) {
        this.log('receive.serverContent', 'interrupted');
        this.emit('interrupted');
        return;
      }
      if ('turnComplete' in serverContent) {
        this.log('server.send', 'turnComplete');
        this.emit('turncomplete');
      }

      if (serverContent.modelTurn) {
        let parts: Part[] = serverContent.modelTurn.parts || [];

        const audioParts = parts.filter(p =>
          p.inlineData?.mimeType?.startsWith('audio/pcm')
        );
        const base64s = audioParts.map(p => p.inlineData?.data);
        const otherParts = difference(parts, audioParts);

        base64s.forEach(b64 => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit('audio', data);
            this.log(`server.audio`, `buffer (${data.byteLength})`);
          }
        });
        if (!otherParts.length) {
          return;
        }

        parts = otherParts;

        const content: LiveServerContent = { modelTurn: { parts } };
        this.emit('content', content);
        this.log(`server.content`, message);
      } else {
        console.log('received unmatched message', message);
      }
    }
  }

  protected onError(e: ErrorEvent) {
    this._status = 'disconnected';
    console.error('error:', e);

    const message = `Could not connect to GenAI Live: ${e.message}`;
    this.log(`server.${e.type}`, message);
    this.emit('error', e);
  }

  protected onOpen() {
    this._status = 'connected';
    this.emit('open');
  }

  protected onClose(e: CloseEvent) {
    this._status = 'disconnected';
    let reason = e.reason || '';
    if (reason.toLowerCase().includes('error')) {
      const prelude = 'ERROR]';
      const preludeIndex = reason.indexOf(prelude);
      if (preludeIndex > 0) {
        reason = reason.slice(preludeIndex + prelude.length + 1, Infinity);
      }
    }

    this.log(
      `server.${e.type}`,
      `disconnected ${reason ? `with reason: ${reason}` : ``}`
    );
    this.emit('close', e);

    if (!this._isManualDisconnect && (e.code !== 1000 || (reason && reason.trim().length > 0))) {
      const lower = (reason || '').toLowerCase();
      if (
        lower.includes('quota') ||
        lower.includes('resource_exhausted') ||
        lower.includes('429') ||
        lower.includes('rate limit') ||
        lower.includes('limit') ||
        lower.includes('token') ||
        lower.includes('unauthenticated') ||
        lower.includes('api_key') ||
        lower.includes('internal error')
      ) {
        this.emit('error', new ErrorEvent('error', { message: reason || `Connection closed (${e.code})` }));
      }
    }
  }

  /**
   * Internal method to emit a log event.
   * @param type - Log type
   * @param message - Log message
   */
  protected log(type: string, message: string | object) {
    this.emit('log', {
      type,
      message,
      date: new Date(),
    });
  }
}
