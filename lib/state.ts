/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { Agent, Charlotte, Paul, Shane, Penny } from './presets/agents';
import { DEFAULT_LIVE_API_MODEL } from './constants';
import { GoogleGenAI } from '@google/genai';

/**
 * Settings and API Key Management
 */
export type ApiTestStatus = 'idle' | 'testing' | 'valid' | 'invalid';

export const useSettings = create<{
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  apiTestStatus: ApiTestStatus;
  apiTestMessage: string;
  setApiTestStatus: (status: ApiTestStatus, message?: string) => void;
  testApiKey: () => Promise<boolean>;
}>((set, get) => {
  const getInitialKey = () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('GEMINI_API_KEY');
        if (stored) return stored;
      }
      if (typeof process !== 'undefined') {
        if (process.env?.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
        if (process.env?.API_KEY) return process.env.API_KEY;
      }
    } catch {
      // ignore
    }
    return '';
  };

  const getInitialModel = () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('GEMINI_LIVE_MODEL');
        const validModels = [
          'gemini-2.5-flash-native-audio-latest',
          'gemini-2.5-flash-native-audio-preview-09-2025',
          'gemini-2.5-flash-native-audio-preview-12-2025',
          'gemini-3.5-live-translate-preview',
        ];
        if (stored && validModels.includes(stored)) {
          return stored;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_LIVE_API_MODEL;
  };

  const initialKey = getInitialKey();

  return {
    apiKey: initialKey,
    setApiKey: (key: string) => {
      const trimmed = key.trim();
      try {
        if (typeof window !== 'undefined') {
          if (trimmed) {
            localStorage.setItem('GEMINI_API_KEY', trimmed);
          } else {
            localStorage.removeItem('GEMINI_API_KEY');
          }
        }
      } catch {
        // ignore
      }
      set({
        apiKey: trimmed,
        apiTestStatus: 'idle',
        apiTestMessage: '',
      });
    },
    model: getInitialModel(),
    setModel: (model: string) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('GEMINI_LIVE_MODEL', model);
        }
      } catch {
        // ignore
      }
      set({ model });
    },
    apiTestStatus: 'idle',
    apiTestMessage: '',
    setApiTestStatus: (status: ApiTestStatus, message = '') =>
      set({ apiTestStatus: status, apiTestMessage: message }),
    testApiKey: async () => {
      const currentKey = get().apiKey.trim();
      if (!currentKey) {
        set({
          apiTestStatus: 'invalid',
          apiTestMessage: 'Please enter a valid Google AI Studio API key.',
        });
        return false;
      }

      set({ apiTestStatus: 'testing', apiTestMessage: 'Testing API key...' });

      try {
        const ai = new GoogleGenAI({ apiKey: currentKey });
        // Perform a quick verification check with standard Gemini model
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: 'Hello',
        });

        if (response) {
          set({
            apiTestStatus: 'valid',
            apiTestMessage: 'API ready & connection verified!',
          });
          return true;
        } else {
          set({
            apiTestStatus: 'valid',
            apiTestMessage: 'API ready',
          });
          return true;
        }
      } catch (err: any) {
        console.error('API Key test failed:', err);
        const errMsg =
          err?.message ||
          'Failed to verify API key. Please check the key and quota.';
        set({
          apiTestStatus: 'invalid',
          apiTestMessage: errMsg.includes('API_KEY_INVALID')
            ? 'Invalid API key. Please verify in Google AI Studio.'
            : errMsg.includes('PERMISSION_DENIED')
            ? 'Permission denied. Ensure this key has Gemini API access.'
            : errMsg.includes('RESOURCE_EXHAUSTED')
            ? 'API Key quota reached in Google AI Studio.'
            : 'API test failed: ' + errMsg.slice(0, 80),
        });
        return false;
      }
    },
  };
});

/**
 * User
 */
export type User = {
  name?: string;
  info?: string;
};

export const useUser = create<
  {
    setName: (name: string) => void;
    setInfo: (info: string) => void;
  } & User
>(set => {
  const getInitial = (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(`user_${key}`) || '';
      }
    } catch {
      // ignore
    }
    return '';
  };

  return {
    name: getInitial('name'),
    info: getInitial('info'),
    setName: name => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_name', name);
        }
      } catch {
        // ignore
      }
      set({ name });
    },
    setInfo: info => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_info', info);
        }
      } catch {
        // ignore
      }
      set({ info });
    },
  };
});

/**
 * Agents with LocalStorage Persistence
 */
const STORAGE_KEYS = {
  MODS: 'VOICE_AGENTS_MODS',
  PERSONAL: 'VOICE_AGENTS_PERSONAL',
  CURRENT: 'VOICE_CURRENT_AGENT_ID',
};

const getStoredMods = (): Record<string, Partial<Agent>> => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.MODS);
      if (stored) return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to parse stored agent mods:', err);
  }
  return {};
};

const getStoredPersonal = (): Agent[] => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.PERSONAL);
      if (stored) return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to parse personal agents:', err);
  }
  return [];
};

const getStoredCurrentId = (): string => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.CURRENT) || '';
    }
  } catch {
    // ignore
  }
  return '';
};

const initialMods = getStoredMods();
const initialPresets: Agent[] = [Paul, Charlotte, Shane, Penny].map(preset => {
  const mod = initialMods[preset.id];
  if (mod) {
    return {
      ...preset,
      ...mod,
      internalPersonality: preset.internalPersonality,
    };
  }
  return preset;
});

const initialPersonal: Agent[] = getStoredPersonal();
const initialCurrentId = getStoredCurrentId();
const initialCurrent: Agent =
  (initialCurrentId
    ? initialPersonal.find(a => a.id === initialCurrentId) ||
      initialPresets.find(a => a.id === initialCurrentId)
    : null) || initialPresets[0];

function getAgentById(id: string) {
  const { availablePersonal, availablePresets } = useAgent.getState();
  return (
    availablePersonal.find(agent => agent.id === id) ||
    availablePresets.find(agent => agent.id === id)
  );
}

export const useAgent = create<{
  current: Agent;
  availablePresets: Agent[];
  availablePersonal: Agent[];
  setCurrent: (agent: Agent | string) => void;
  addAgent: (agent: Agent) => void;
  update: (agentId: string, adjustments: Partial<Agent>) => void;
}>((set, get) => ({
  current: initialCurrent,
  availablePresets: initialPresets,
  availablePersonal: initialPersonal,

  addAgent: (agent: Agent) => {
    set(state => {
      const updatedPersonal = [...state.availablePersonal, agent];
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            STORAGE_KEYS.PERSONAL,
            JSON.stringify(updatedPersonal)
          );
          localStorage.setItem(STORAGE_KEYS.CURRENT, agent.id);
        }
      } catch (err) {
        console.error('Failed to save added agent:', err);
      }
      return {
        availablePersonal: updatedPersonal,
        current: agent,
      };
    });
  },

  setCurrent: (agent: Agent | string) => {
    const targetAgent = typeof agent === 'string' ? getAgentById(agent) : agent;
    if (!targetAgent) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CURRENT, targetAgent.id);
      }
    } catch {
      // ignore
    }
    set({ current: targetAgent });
  },

  update: (agentId: string, adjustments: Partial<Agent>) => {
    const agent = getAgentById(agentId);
    if (!agent) return;
    const updatedAgent = { ...agent, ...adjustments };

    set(state => {
      const isPersonal = state.availablePersonal.some(a => a.id === agentId);
      const newPresets = state.availablePresets.map(a =>
        a.id === agentId ? updatedAgent : a
      );
      const newPersonal = state.availablePersonal.map(a =>
        a.id === agentId ? updatedAgent : a
      );
      const newCurrent =
        state.current.id === agentId ? updatedAgent : state.current;

      try {
        if (typeof window !== 'undefined') {
          if (isPersonal) {
            localStorage.setItem(
              STORAGE_KEYS.PERSONAL,
              JSON.stringify(newPersonal)
            );
          } else {
            const currentMods = getStoredMods();
            currentMods[agentId] = {
              ...(currentMods[agentId] || {}),
              ...adjustments,
            };
            localStorage.setItem(
              STORAGE_KEYS.MODS,
              JSON.stringify(currentMods)
            );
          }
        }
      } catch (err) {
        console.error('Failed to persist agent update:', err);
      }

      return {
        availablePresets: newPresets,
        availablePersonal: newPersonal,
        current: newCurrent,
      };
    });
  },
}));

/**
 * UI
 */
export const useUI = create<{
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
}>(set => ({
  showUserConfig: false,
  setShowUserConfig: (show: boolean) => set({ showUserConfig: show }),
  showAgentEdit: false,
  setShowAgentEdit: (show: boolean) => set({ showAgentEdit: show }),
}));
