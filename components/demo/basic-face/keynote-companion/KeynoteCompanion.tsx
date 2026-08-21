/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef } from 'react';
import { Modality } from '@google/genai';

import BasicFace from '../basic-face/BasicFace';
import LiveWaveform from '../live-waveform/LiveWaveform';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { createSystemInstructions } from '@/lib/prompts';
import { useAgent, useUser } from '@/lib/state';

export default function KeynoteCompanion() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const user = useUser();
  const { current } = useAgent();
  const greetedAgentIdRef = useRef<string | null>(null);

  // Set the configuration for the Live API
  useEffect(() => {
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: current.voice },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: createSystemInstructions(current, user),
          },
        ],
      },
    });
  }, [setConfig, user, current]);

  // Initiate greeting once per agent session to avoid restarting conversation after network reconnects
  useEffect(() => {
    if (!connected) return;

    if (greetedAgentIdRef.current !== current.id) {
      greetedAgentIdRef.current = current.id;
      // Delay microtick to ensure connection handshake is completely primed
      const timer = setTimeout(() => {
        client.send(
          {
            text: 'Greet the user enthusiastically, introducing yourself and your role warmly in one brief sentence.',
          },
          true
        );
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [client, connected, current.id]);

  return (
    <div className="keynote-companion">
      <BasicFace canvasRef={faceCanvasRef!} color={current.bodyColor} />
      <LiveWaveform />
    </div>
  );
}
