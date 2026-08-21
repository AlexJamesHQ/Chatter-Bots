/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import Modal from './Modal';
import { useSettings, useUI, useUser } from '@/lib/state';

const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash-native-audio-latest',
    name: 'Gemini 2.5 Flash Native Audio',
    tag: 'Recommended (Real-Time Audio & Banter)',
  },
  {
    id: 'gemini-2.5-flash-native-audio-preview-12-2025',
    name: 'Gemini 2.5 Flash Preview',
    tag: 'Fast Voice Stream',
  },
  {
    id: 'gemini-3.5-live-translate-preview',
    name: 'Gemini 3.5 Live Translate',
    tag: 'Real-Time Speech Translation',
  },
];

export default function UserSettings() {
  const { name, info, setName, setInfo } = useUser();
  const {
    apiKey,
    setApiKey,
    model,
    setModel,
    apiTestStatus,
    apiTestMessage,
    testApiKey,
  } = useSettings();
  const { setShowUserConfig } = useUI();

  const [inputKey, setInputKey] = useState(apiKey);
  const [showKeyField, setShowKeyField] = useState(!apiKey);
  const [showKeyPlain, setShowKeyPlain] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);

  const portfolioUrl = 'https://alex-james.vercel.app/';

  const handleSaveKey = () => {
    setApiKey(inputKey);
    setShowKeyField(false);
  };

  const handleRefreshModels = () => {
    setIsRefreshingModels(true);
    setTimeout(() => {
      setIsRefreshingModels(false);
    }, 600);
  };

  const copyPortfolio = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(portfolioUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Modal onClose={() => setShowUserConfig(false)}>
      <div className="ios-settings-container">
        {/* Header */}
        <div className="ios-settings-header">
          <div className="ios-header-icon">
            <span className="icon">settings</span>
          </div>
          <div>
            <h2 className="ios-settings-title">Settings & API Config</h2>
            <p className="ios-settings-subtitle">
              Configure Google AI Studio API, models & bilingual preferences
            </p>
          </div>
        </div>

        {/* Section 1: Google AI Studio API & Live Engine (iOS Grouped Style) */}
        <div className="ios-section">
          <div className="ios-section-header">GOOGLE AI STUDIO API</div>
          <div className="ios-card-group">
            {/* API Key Row */}
            <div
              className="ios-row ios-row-interactive"
              onClick={() => setShowKeyField(!showKeyField)}
            >
              <div className="ios-row-left">
                <div className="ios-item-icon api-icon">
                  <span className="icon">vpn_key</span>
                </div>
                <div className="ios-item-content">
                  <div className="ios-item-title">API key</div>
                  <div className="ios-item-subtitle">
                    {apiKey ? (
                      <span className="status-configured">
                        ● Configured (ends in ...{apiKey.slice(-4)})
                      </span>
                    ) : (
                      <span className="status-missing">
                        Not configured • Tap to enter key
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="ios-row-right">
                <button
                  type="button"
                  className="ios-action-chip"
                  onClick={e => {
                    e.stopPropagation();
                    setShowKeyField(!showKeyField);
                  }}
                >
                  {showKeyField ? 'Hide' : apiKey ? 'Edit' : 'Add Key'}
                </button>
              </div>
            </div>

            {/* Expandable API Key Input */}
            {showKeyField && (
              <div className="ios-key-input-panel">
                <div className="ios-input-wrapper">
                  <input
                    type={showKeyPlain ? 'text' : 'password'}
                    value={inputKey}
                    onChange={e => setInputKey(e.target.value)}
                    placeholder="Enter your Google AI Studio API key (AIzaSy...)"
                    className="ios-text-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="ios-icon-btn"
                    onClick={() => setShowKeyPlain(!showKeyPlain)}
                    title={showKeyPlain ? 'Hide API key' : 'Show API key'}
                  >
                    <span className="icon">
                      {showKeyPlain ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                <div className="ios-key-actions">
                  <div className="ios-key-help">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ios-help-link"
                    >
                      <span className="icon">open_in_new</span>
                      Get Google AI Studio API Key
                    </a>
                  </div>
                  <div className="ios-btn-group">
                    {inputKey && (
                      <button
                        type="button"
                        className="ios-secondary-btn"
                        onClick={() => {
                          setInputKey('');
                          setApiKey('');
                        }}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      className="ios-primary-btn"
                      onClick={handleSaveKey}
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Model Row */}
            <div className="ios-row">
              <div className="ios-row-left">
                <div className="ios-item-icon model-icon">
                  <span className="icon">auto_awesome</span>
                </div>
                <div className="ios-item-content">
                  <div className="ios-item-title">Model</div>
                  <div className="ios-item-subtitle">
                    <select
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      className="ios-select-model"
                    >
                      {AVAILABLE_MODELS.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.tag})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="ios-row-right">
                <button
                  type="button"
                  className={`ios-circle-btn ${
                    isRefreshingModels ? 'spinning' : ''
                  }`}
                  onClick={handleRefreshModels}
                  title="Refresh model list"
                >
                  <span className="icon">sync</span>
                </button>
              </div>
            </div>

            {/* Test API Row */}
            <div className="ios-row ios-row-interactive" onClick={testApiKey}>
              <div className="ios-row-left">
                <div
                  className={`ios-item-icon test-icon ${
                    apiTestStatus === 'valid'
                      ? 'icon-valid'
                      : apiTestStatus === 'invalid'
                      ? 'icon-invalid'
                      : ''
                  }`}
                >
                  <span className="icon">
                    {apiTestStatus === 'valid'
                      ? 'check_circle'
                      : apiTestStatus === 'invalid'
                      ? 'error'
                      : apiTestStatus === 'testing'
                      ? 'hourglass_empty'
                      : 'check'}
                  </span>
                </div>
                <div className="ios-item-content">
                  <div className="ios-item-title">Test API</div>
                  <div className="ios-item-subtitle">
                    {apiTestStatus === 'valid' ? (
                      <span className="status-valid">
                        API ready • Connection verified
                      </span>
                    ) : apiTestStatus === 'testing' ? (
                      <span className="status-testing">Testing connection...</span>
                    ) : apiTestStatus === 'invalid' ? (
                      <span className="status-invalid">
                        {apiTestMessage || 'API test failed'}
                      </span>
                    ) : apiKey ? (
                      <span>Tap to test API readiness</span>
                    ) : (
                      <span>Add API key to test</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="ios-row-right">
                <button
                  type="button"
                  className="ios-action-chip"
                  onClick={e => {
                    e.stopPropagation();
                    testApiKey();
                  }}
                  disabled={!apiKey || apiTestStatus === 'testing'}
                >
                  {apiTestStatus === 'testing' ? 'Testing...' : 'Test Now'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: User Profile Context */}
        <div className="ios-section">
          <div className="ios-section-header">YOUR PROFILE CONTEXT</div>
          <div className="ios-card-group">
            <div className="ios-profile-field">
              <label className="ios-label">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="What should the characters call you?"
                className="ios-text-input"
              />
            </div>
            <div className="ios-profile-field">
              <label className="ios-label">Interests & Background</label>
              <textarea
                rows={2}
                value={info}
                onChange={e => setInfo(e.target.value)}
                placeholder="Likes, topics you enjoy discussing, hobbies, favorite foods..."
                className="ios-text-area"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Developer & Creator (iOS Style) */}
        <div className="ios-section">
          <div className="ios-section-header">DEVELOPER & CREATOR</div>
          <div className="ios-card-group">
            {/* Portfolio Row */}
            <div
              className="ios-row ios-row-interactive"
              onClick={() => window.open(portfolioUrl, '_blank', 'noopener,noreferrer')}
            >
              <div className="ios-row-left">
                <div className="ios-item-icon portfolio-icon" style={{ overflow: 'hidden', padding: 0 }}>
                  <img
                    src="https://github.com/user-attachments/assets/39d57249-29e6-447a-8da9-3d9ad92cb796"
                    alt="Alex James"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="ios-item-content">
                  <div className="ios-item-title">Alex James</div>
                </div>
              </div>
              <div className="ios-row-right">
                <button
                  type="button"
                  className="ios-icon-btn"
                  onClick={copyPortfolio}
                  title="Copy portfolio link"
                >
                  <span className="icon">{copiedLink ? 'done' : 'content_copy'}</span>
                </button>
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ios-open-link-btn"
                  onClick={e => e.stopPropagation()}
                  title="Open in new tab"
                >
                  <span className="icon">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <div className="ios-footer">
          <button
            type="button"
            className="button primary ios-done-btn"
            onClick={() => {
              if (inputKey !== apiKey) {
                setApiKey(inputKey);
              }
              setShowUserConfig(false);
            }}
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

