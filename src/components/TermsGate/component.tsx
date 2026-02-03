import React, { useCallback, useEffect, useState } from 'react';
import { createBackendAxiosRequest } from 'store/requests';
import { getBearerToken, getBearerTokenHeader } from 'store/actionCreators';

type TermsResponse = { accepted: number; currentVersion: number };

const TermsGate: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  const [status, setStatus] = useState<TermsResponse>({ accepted: 0, currentVersion: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const needsToken = isAuthenticated && !getBearerToken();

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated || needsToken) return;
    setLoading(true);
    try {
      const res = await createBackendAxiosRequest<TermsResponse>({ method: 'GET', url: 'auth/terms', headers: getBearerTokenHeader() });
      setStatus(res.data);
    } catch { /* noop */ }
    setLoading(false);
  }, [isAuthenticated, needsToken]);

  useEffect(() => { void fetchStatus(); }, [fetchStatus]);

  const accept = useCallback(async () => {
    if (!isAuthenticated || needsToken) return;
    setSaving(true);
    try {
      const res = await createBackendAxiosRequest<TermsResponse>({
        method: 'PUT', url: 'auth/terms', data: { version: status.currentVersion }, headers: getBearerTokenHeader(),
      });
      setStatus(res.data);
    } catch { /* noop */ }
    setSaving(false);
  }, [isAuthenticated, needsToken, status.currentVersion]);

  const shouldShow = isAuthenticated && !loading && status.accepted < status.currentVersion;
  if (!shouldShow) return null;

  return (
    <div className="onboarding-gate" role="dialog" aria-modal="true" aria-label="Terms and Conditions">
      <div className="onboarding-modal" style={{ maxWidth: 520 }}>
        <h2>Terms & Conditions</h2>
        <p style={{ opacity: 0.75, fontSize: 14 }}>
          By continuing, you agree to the Beta Terms: promo bankroll; no deposit required; withdrawals limited to winnings; abuse may lead to forfeiture.
        </p>
        <div style={{
          marginTop: 12, display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button type="button" className="primary" onClick={accept} disabled={saving}>{saving ? 'Saving…' : 'I Agree'}</button>
        </div>
      </div>
    </div>
  );
};

export default TermsGate;
