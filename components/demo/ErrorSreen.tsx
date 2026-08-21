/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useUI } from '@/lib/state';
import React, { useEffect, useState } from 'react';

export interface ExtendedErrorType {
  code?: number;
  message?: string;
  status?: string;
}

export default function ErrorScreen() {
  const { client, connect } = useLiveAPIContext();
  const { setShowUserConfig } = useUI();
  const [error, setError] = useState<{ message?: string } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    function onError(error: ErrorEvent) {
      console.error('Live API Error Event:', error);
      setError(error);
    }

    client.on('error', onError);

    return () => {
      client.off('error', onError);
    };
  }, [client]);

  if (!error) {
    return null;
  }

  const rawMsg = (error?.message || '').toLowerCase();

  // Determine error category
  const isQuotaExhausted =
    rawMsg.includes('resource_exhausted') ||
    rawMsg.includes('quota') ||
    rawMsg.includes('429') ||
    rawMsg.includes('rate limit') ||
    rawMsg.includes('limit') ||
    rawMsg.includes('token') ||
    rawMsg.includes('exhausted');

  const isApiKeyInvalid =
    !isQuotaExhausted &&
    (rawMsg.includes('api_key_invalid') ||
      rawMsg.includes('api key') ||
      rawMsg.includes('unauthenticated') ||
      rawMsg.includes('permission_denied') ||
      rawMsg.includes('401') ||
      rawMsg.includes('403') ||
      rawMsg.includes('forbidden'));

  const isInternalError =
    !isQuotaExhausted &&
    !isApiKeyInvalid &&
    (rawMsg.includes('internal error') || rawMsg.includes('500') || rawMsg.includes('503'));

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      setError(null);
      await connect();
    } catch (e: any) {
      console.error('Retry failed:', e);
      setError({ message: e?.message || 'Failed to reconnect' });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleOpenSettings = () => {
    setError(null);
    setShowUserConfig(true);
  };

  const handleDismiss = () => {
    setError(null);
  };

  return (
    <div className="error-screen-overlay" role="dialog" aria-modal="true">
      <div className="error-card-wrapper">
        {/* Glowing aura header icon based on type */}
        <div
          className={`error-badge-icon ${
            isQuotaExhausted
              ? 'badge-quota'
              : isApiKeyInvalid
              ? 'badge-key'
              : isInternalError
              ? 'badge-server'
              : 'badge-default'
          }`}
        >
          <span className="material-symbols-outlined icon">
            {isQuotaExhausted
              ? 'hourglass_empty'
              : isApiKeyInvalid
              ? 'key'
              : isInternalError
              ? 'dns'
              : 'error_outline'}
          </span>
        </div>

        {/* Quota / Token Exhausted Beautiful Message */}
        {isQuotaExhausted ? (
          <div className="error-body-content">
            <div className="error-status-pill pill-amber">
              <span className="pill-dot"></span>
              Google AI Studio Token / Quota Limit
            </div>

            <h2 className="error-main-title">
              Token Quota or Rate Limit Exhausted
            </h2>

            <div className="error-description-box">
              <p className="error-desc-en">
                Your current Google AI Studio API key has exceeded its free token quota or rate limit.
              </p>
            </div>

            {/* Helpful Solution Card */}
            <div className="error-help-card">
              <div className="help-card-header">
                <span className="material-symbols-outlined help-icon">lightbulb</span>
                <span className="help-card-title">Quick Solution:</span>
              </div>
              <ul className="help-card-list">
                <li>
                  Generate a new free API key from Google AI Studio and paste it in Settings to continue speaking immediately.
                </li>
                <li>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="help-link"
                  >
                    <span>Get Free Google AI Studio API Key</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      open_in_new
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        ) : isApiKeyInvalid ? (
          <div className="error-body-content">
            <div className="error-status-pill pill-red">
              <span className="pill-dot"></span>
              Authentication Error
            </div>

            <h2 className="error-main-title">Invalid or Missing API Key</h2>

            <div className="error-description-box">
              <p className="error-desc-en">
                The Google AI Studio API Key was not found or is invalid. Please configure your API key in Settings.
              </p>
            </div>
          </div>
        ) : isInternalError ? (
          <div className="error-body-content">
            <div className="error-status-pill pill-blue">
              <span className="pill-dot"></span>
              Connection Notice
            </div>

            <h2 className="error-main-title">Live Connection Interrupted</h2>

            <div className="error-description-box">
              <p className="error-desc-en">
                The live audio stream was interrupted by the server. Please click Reconnect or switch the Live model in Settings.
              </p>
            </div>
          </div>
        ) : (
          <div className="error-body-content">
            <div className="error-status-pill pill-neutral">
              <span className="pill-dot"></span>
              Notice
            </div>

            <h2 className="error-main-title">An Unexpected Issue Occurred</h2>

            <div className="error-description-box">
              <p className="error-desc-en">
                {error?.message || 'A temporary connection error occurred. Please try again.'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="error-actions-group">
          <button
            className="error-btn-primary"
            onClick={handleOpenSettings}
            type="button"
          >
            <span className="material-symbols-outlined icon">tune</span>
            <span>Configure Key in Settings</span>
          </button>

          <button
            className="error-btn-secondary"
            onClick={handleRetry}
            disabled={isRetrying}
            type="button"
          >
            <span className="material-symbols-outlined icon">refresh</span>
            <span>{isRetrying ? 'Connecting...' : 'Reconnect'}</span>
          </button>

          <button
            className="error-btn-ghost"
            onClick={handleDismiss}
            type="button"
          >
            Dismiss
          </button>
        </div>

        {error?.message && (
          <div className="error-debug-details">
            <code>{error.message}</code>
          </div>
        )}
      </div>
    </div>
  );
}
