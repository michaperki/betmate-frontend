import React, { useEffect, useState } from 'react';
import Header from 'components/Header';
import { createBackendAxiosRequest } from 'store/requests';
import { getBearerTokenHeader } from 'store/actionCreators';

type TermsResponse = { accepted: number; currentVersion: number };

const TermsPage: React.FC = () => {
  const [status, setStatus] = useState<TermsResponse>({ accepted: 0, currentVersion: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await createBackendAxiosRequest<TermsResponse>({ method: 'GET', url: 'auth/terms', headers: getBearerTokenHeader() });
        setStatus(res.data);
      } catch (e: any) {
        setErr(e?.response?.data?.error || 'Failed to load terms status');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const accept = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await createBackendAxiosRequest<TermsResponse>({ method: 'PUT', url: 'auth/terms', data: { version: status.currentVersion }, headers: getBearerTokenHeader() });
      setStatus(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to accept terms');
    } finally {
      setSaving(false);
    }
  };

  const accepted = status.accepted >= status.currentVersion;

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Header />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 80px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px' }}>Terms & Conditions</h1>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 16 }}>
              <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
                By using BetMate, you agree to abide by our Beta Terms: promo bankroll; no deposit required; withdrawals limited to winnings; abuse may lead to forfeiture. Additional terms may apply.
              </p>
              <p style={{ opacity: 0.7, fontSize: 13 }}>Version {status.currentVersion}</p>
              {err && <div style={{ color: 'var(--error)', marginTop: 8 }}>{err}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="primary" onClick={accept} disabled={saving || accepted}>
                  {accepted ? 'Accepted' : (saving ? 'Saving…' : 'I Agree')}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TermsPage;

