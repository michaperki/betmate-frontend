import React, { useCallback, useEffect, useState } from 'react';

import { createBackendAxiosRequest } from 'store/requests';
import { getBearerToken, getBearerTokenHeader } from 'store/actionCreators';
import { logger } from 'utils';

import './style.scss';

interface OnboardingStatusResponse {
  versionSeen: number;
  currentVersion: number;
}

interface OnboardingGateProps {
  isAuthenticated: boolean;
}

const defaultStatus: OnboardingStatusResponse = {
  versionSeen: 0,
  currentVersion: 0,
};

const OnboardingGate: React.FC<OnboardingGateProps> = ({ isAuthenticated }) => {
  const [status, setStatus] = useState<OnboardingStatusResponse>(defaultStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'intro' | 'overview'>('intro');

  const needsToken = isAuthenticated && !getBearerToken();

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated || needsToken) return;

    setLoading(true);
    try {
      const response = await createBackendAxiosRequest<OnboardingStatusResponse>({
        method: 'GET',
        url: 'auth/onboarding',
        headers: getBearerTokenHeader(),
      });

      setStatus(response.data);
      setError(null);
    } catch (err) {
      logger.error('onboarding_status_load_failed', 'Failed to load onboarding status', {
        error: err instanceof Error ? err.message : err,
      });
      setError('Unable to load onboarding status');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, needsToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus(defaultStatus);
      setError(null);
      return;
    }

    void fetchStatus();
  }, [fetchStatus, isAuthenticated]);

  const handleComplete = useCallback(async () => {
    if (!isAuthenticated || needsToken) return;

    setSaving(true);
    try {
      const response = await createBackendAxiosRequest<OnboardingStatusResponse>({
        method: 'PUT',
        url: 'auth/onboarding',
        data: { version: status.currentVersion },
        headers: getBearerTokenHeader(),
      });

      setStatus(response.data);
      setError(null);
    } catch (err) {
      logger.error('onboarding_status_save_failed', 'Failed to save onboarding status', {
        error: err instanceof Error ? err.message : err,
      });
      setError('Unable to save onboarding preference');
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, needsToken, status.currentVersion]);

  if (!isAuthenticated || loading || error) {
    return null;
  }

  const shouldShow = status.versionSeen < status.currentVersion;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="onboarding-gate">
      <div className="onboarding-modal">
        <h2>Welcome to BetMate</h2>
        {view === 'intro' ? (
          <>
            <p>
              Before you jump into your first wagers, you can take a quick tour of the interface.
              We&apos;ll highlight drag-and-drop betting, bankroll management, and the new wager sidebar.
            </p>
            <div className="onboarding-actions">
              <button type="button" className="primary" onClick={() => setView('overview')}>
                Show me around
              </button>
              <button
                type="button"
                className="ghost"
                onClick={handleComplete}
                disabled={saving}
              >
                Skip for now
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Coming soon: a guided walkthrough. For now, here&apos;s what to look for:</p>
            <ul>
              <li>Drag a piece to any square to open a bet preview instantly.</li>
              <li>Use the wager sidebar to fine-tune odds and confirm slips.</li>
              <li>Track bankroll momentum at the top bar so you know when to cash in.</li>
            </ul>
            <div className="onboarding-actions">
              <button
                type="button"
                className="primary"
                onClick={handleComplete}
                disabled={saving}
              >
                Let&rsquo;s play
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setView('intro')}
                disabled={saving}
              >
                Back
              </button>
            </div>
          </>
        )}
        {saving && <p className="onboarding-status-text">Saving preference...</p>}
      </div>
    </div>
  );
};

export default OnboardingGate;
