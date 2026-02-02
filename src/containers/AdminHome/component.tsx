import React, { useEffect, useState } from 'react';
import Header from 'components/Header';
import { NavLink } from 'react-router-dom';
import { getAdminFeatures, updateAdminFeatures, getAdminHome, sendAdminTestEmail } from 'store/requests/adminRequests';
import '../../styles/admin.scss';

const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }>= ({ label, value, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
    <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    <span>{label}</span>
  </label>
);

const Card: React.FC<{ title: string; actions?: React.ReactNode }>= ({ title, actions, children }) => (
  <div className="admin-card">
    <div className="admin-card__title">
      <span>{title}</span>
      {actions}
    </div>
    {children}
  </div>
);

const Row: React.FC<{ k: string; v: any }>= ({ k, v }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
    <div style={{ opacity: 0.8 }}>{k}</div>
    <div>{String(v)}</div>
  </div>
);

const AdminHome: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<any>({});
  const [home, setHome] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  // Email test state
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('BetMate Test Email');
  const [emailMessage, setEmailMessage] = useState('This is a test email from BetMate.');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok?: boolean; error?: string; messageId?: string; previewUrl?: string } | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [f, h] = await Promise.all([getAdminFeatures(), getAdminHome()]);
      setFeatures(f);
      setHome(h);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const patch = async (p: any) => {
    setSaving(true);
    try {
      const nf = await updateAdminFeatures(p);
      setFeatures(nf);
      // also refresh status tiles if relevant
      const h = await getAdminHome();
      setHome(h);
      // notify global listeners (ModeContext) to refresh /api/status
      try { window.dispatchEvent(new CustomEvent('betmate:refresh-status')); } catch {}
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Header />
        <div style={{ padding: 24 }}>Loading admin…</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page admin-content">
      <Header />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="admin-tabs">
          <NavLink to="/admin">Home</NavLink>
          <NavLink to="/admin/risk">Risk</NavLink>
          <NavLink to="/admin/wallet">Wallet</NavLink>
          <NavLink to="/admin/kyc">KYC</NavLink>
          <NavLink to="/admin/ops">Ops</NavLink>
          <NavLink to="/admin/invites">Invites</NavLink>
          <NavLink to="/admin/email">Email</NavLink>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Admin — Home</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <Card title="Environment" actions={<NavLink to="/admin">Home</NavLink>}>
            {home?.env && (
              <>
                <Row k="Env" v={home.env.nodeEnv} />
                <Row k="Version" v={home.env.version} />
                <Row k="Commit" v={home.env.commit} />
                <Row k="Release" v={home.env.release} />
                <Row k="Uptime (s)" v={Math.round((home.env.uptimeMs || 0)/1000)} />
                <Row k="Payments" v={home.env.provider} />
                {home?.env?.email && (
                  <Row k="Email" v={`${home.env.email.provider}${home.env.email.host ? ` (${home.env.email.host})` : ''}`} />
                )}
              </>
            )}
          </Card>
          <Card title="Risk" actions={<NavLink to="/admin/risk">Open</NavLink>}>
            {home?.risk && (
              <>
                <Row k="Bankroll" v={home.risk.bankroll} />
                <Row k="Global exposure" v={home.risk.globalExposure} />
                <Row k="Safe max stake" v={home.risk.safeMaxStake} />
              </>
            )}
          </Card>
          <Card title="Payments (24h)" actions={<NavLink to="/admin/wallet">Open</NavLink>}>
            {home?.payments && (
              <>
                <Row k="Pending" v={home.payments.pending} />
                <Row k="Confirmed" v={home.payments.confirmed24h} />
                <Row k="Failed" v={home.payments.failed24h} />
              </>
            )}
          </Card>
          <Card title="Health" actions={<NavLink to="/admin/ops">Open</NavLink>}>
            {home?.health && (
              <>
                <Row k="DB" v={home.health.db} />
                <Row k="Microservice:" v={home.health.microserviceUrl || 'unset'} />
                <Row k="Rate-limits" v={home.health.rateLimitRecent} />
              </>
            )}
          </Card>
        </div>

        <Card title="Feature Flags">
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <Toggle label="Real Mode" value={!!features.realModeEnabled} onChange={(v) => patch({ realModeEnabled: v })} />
            <Toggle label="Faucet" value={!!features.enableFaucet} onChange={(v) => patch({ enableFaucet: v })} />
            <Toggle label="Rate Limiting" value={!!features.enableRateLimiting} onChange={(v) => patch({ enableRateLimiting: v })} />
            <Toggle label="Withdrawals" value={!!features.enableWithdrawals} onChange={(v) => patch({ enableWithdrawals: v })} />
            <Toggle label="Require KYC" value={!!features.requireKyc} onChange={(v) => patch({ requireKyc: v })} />
            <Toggle label="Require Email Verification" value={!!features.requireEmailVerification} onChange={(v) => patch({ requireEmailVerification: v })} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Pricing Model</span>
              <input
                type="text"
                value={features.pricingModelVersion || ''}
                onChange={(e) => setFeatures({ ...features, pricingModelVersion: e.target.value })}
                onBlur={() => patch({ pricingModelVersion: features.pricingModelVersion })}
                style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }}
              />
            </div>
            {saving && <span style={{ opacity: 0.7 }}>Saving…</span>}
          </div>
        </Card>

        <Card title="Email — Send Test">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>To</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>Subject</span>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>Message</span>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={4}
                style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', resize: 'vertical' }}
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                disabled={emailSending || !emailTo}
                onClick={async () => {
                  setEmailSending(true);
                  setEmailResult(null);
                  try {
                    const res = await sendAdminTestEmail({ to: emailTo, subject: emailSubject, message: emailMessage });
                    setEmailResult(res);
                  } catch (e: any) {
                    setEmailResult({ ok: false, error: e?.response?.data?.error || e?.message || 'Failed to send' });
                  } finally {
                    setEmailSending(false);
                  }
                }}
                style={{
                  background: emailSending ? '#333' : '#4a90e2',
                  border: 'none', color: '#fff', padding: '8px 12px', borderRadius: 4,
                  cursor: emailSending ? 'default' : 'pointer'
                }}
              >
                {emailSending ? 'Sending…' : 'Send Test Email'}
              </button>
              {emailResult?.ok && emailResult?.messageId && (
                <span style={{ opacity: 0.9 }}>Sent — ID: {emailResult.messageId}{emailResult.previewUrl ? ' • Preview below' : ''}</span>
              )}
              {emailResult && emailResult.ok === false && (
                <span style={{ color: '#f66' }}>Error: {emailResult.error || 'Failed to send'}</span>
              )}
            </div>
            {emailResult?.previewUrl && (
              <div>
                <a href={emailResult.previewUrl} target="_blank" rel="noreferrer">Open Ethereal Preview</a>
              </div>
            )}
          </div>
        </Card>
      </div>
      
    </div>
  );
};

export default AdminHome;
