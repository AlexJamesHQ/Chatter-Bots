/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { Agent, createNewAgent } from '@/lib/presets/agents';
import { useAgent, useSettings, useUI, useUser } from '@/lib/state';
import c from 'classnames';
import { useEffect, useState } from 'react';

export default function Header() {
  const { showUserConfig, setShowUserConfig, setShowAgentEdit } = useUI();
  const { name } = useUser();
  const { apiKey } = useSettings();
  const { current, setCurrent, availablePresets, availablePersonal, addAgent } =
    useAgent();
  const { disconnect } = useLiveAPIContext();

  let [showRoomList, setShowRoomList] = useState(false);

  useEffect(() => {
    addEventListener('click', () => setShowRoomList(false));
    return () => removeEventListener('click', () => setShowRoomList(false));
  }, []);

  function changeAgent(agent: Agent | string) {
    disconnect();
    setCurrent(agent);
  }

  function addNewChatterBot() {
    disconnect();
    addAgent(createNewAgent());
    setShowAgentEdit(true);
  }

  return (
    <header>
      <div className="roomInfo">
        <div className="roomName">
          <button
            onClick={e => {
              e.stopPropagation();
              setShowRoomList(!showRoomList);
            }}
          >
            <h1 className={c({ active: showRoomList })}>
              {current.name}
              <span className="icon">arrow_drop_down</span>
            </h1>
          </button>

          <button
            onClick={() => setShowAgentEdit(true)}
            className="button createButton"
          >
            <span className="icon">edit</span> Edit
          </button>
        </div>

        <div className={c('roomList', { active: showRoomList })}>
          <div>
            <h3>Presets</h3>
            <ul>
              {availablePresets
                .filter(agent => agent.id !== current.id)
                .map(agent => (
                  <li
                    key={agent.name}
                    className={c({ active: agent.id === current.id })}
                  >
                    <button onClick={() => changeAgent(agent)}>
                      {agent.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3>Your ChatterBots</h3>
            {
              <ul>
                {availablePersonal.length ? (
                  availablePersonal.map(({ id, name }) => (
                    <li key={name} className={c({ active: id === current.id })}>
                      <button onClick={() => changeAgent(id)}>{name}</button>
                    </li>
                  ))
                ) : (
                  <p>None yet.</p>
                )}
              </ul>
            }
            <button
              className="newRoomButton"
              onClick={() => {
                addNewChatterBot();
              }}
            >
              <span className="icon">add</span>New ChatterBot
            </button>
          </div>
        </div>
      </div>
      <button
        className="userSettingsButton"
        onClick={() => setShowUserConfig(!showUserConfig)}
        title={apiKey ? "Settings & API Key Configured" : "Settings (API Key Required)"}
      >
        <p className='user-name'>{name || 'Your name'}</p>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <span className="icon">tune</span>
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: apiKey ? '#34a853' : '#ff4600',
              border: '1.5px solid #181a1b',
            }}
          />
        </div>
      </button>
    </header>
  );
}
