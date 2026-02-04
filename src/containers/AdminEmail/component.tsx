import React, { useEffect, useState } from 'react';
import { getAdminFeatures, updateAdminFeatures, adminResendVerification, adminPreprovisionInvites } from 'store/requests/adminRequests';
import '../../styles/admin.scss';

const Row: React.FC<{ k: string; v: any }>= ({ k, v }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
    <div style={{ opacity: 0.8 }}>{k}</div>
    <div>{String(v)}</div>
  </div>
);

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

const AdminEmail: React.FC = () => {
  const [features, setFeatures] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ ok?: boolean; sent?: boolean; error?: string } | null>(null);

  const [inviteList, setInviteList] = useState('');
  const [campaign, setCampaign] = useState('BETA');
  const [grantTokens, setGrantTokens] = useState<number>(0);
  const [grantCash, setGrantCash] = useState<number>(0);
  const [maxRedemptions, setMaxRedemptions] = useState<number>(1);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);

  const refresh = async () => {
    setLoading(true);
    try { setFeatures(await getAdminFeatures()); } finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const patch = async (p: any) => {
    setSaving(true);
    try { setFeatures(await updateAdminFeatures(p)); } finally { setSaving(false); }
  };

  if (loading) return (<div className="admin-content"><div>Loading admin…</div></div>);

  return (
    <div className="admin-content">
      <div style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Admin — Email</div>

        <Card title="Automations">
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <Toggle label="Deposit Emails" value={!!features.enableEmailDeposits} onChange={(v) => patch({ enableEmailDeposits: v })} />
            <Toggle label="Withdrawal Emails" value={!!features.enableEmailWithdrawals} onChange={(v) => patch({ enableEmailWithdrawals: v })} />
            <Toggle label="Invite Emails" value={!!features.enableEmailInvites} onChange={(v) => patch({ enableEmailInvites: v })} />
            <Toggle label="Require Email Verification" value={!!features.requireEmailVerification} onChange={(v) => patch({ requireEmailVerification: v })} />
            {saving && <span style={{ opacity: 0.7 }}>Saving…</span>}
          </div>
        </Card>

        <Card title="Resend Verification">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="email" placeholder="user@example.com" value={verifyEmail} onChange={(e) => setVerifyEmail(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} />
            <button onClick={async () => { setVerifyResult(null); try { setVerifyResult(await adminResendVerification(verifyEmail)); } catch (e: any) { setVerifyResult({ ok: false, error: e?.response?.data?.error || e?.message }); } }} style={{ background: '#4a90e2', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: 4 }}>Resend</button>
            {verifyResult && (<span>{verifyResult.ok ? (verifyResult.sent ? 'Sent' : 'Already verified') : (verifyResult.error || 'Error')}</span>)}
          </div>
        </Card>

        <Card title="Send Beta Invites (Bulk)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
            <label>Email list (one per line or comma-separated)</label>
            <textarea rows={6} placeholder={'alice@example.com\nbob@example.com'} value={inviteList} onChange={(e) => setInviteList(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label>Campaign <input type="text" value={campaign} onChange={(e) => setCampaign(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} /></label>
              <label>Grant Tokens <input type="number" value={grantTokens} onChange={(e) => setGrantTokens(Number(e.target.value || 0))} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} /></label>
              <label>Grant USD <input type="number" value={grantCash} onChange={(e) => setGrantCash(Number(e.target.value || 0))} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} /></label>
              <label>Max Redemptions <input type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(Number(e.target.value || 1))} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} /></label>
              <label>Expires At (ISO) <input type="text" placeholder="YYYY-MM-DD" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} /></label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button disabled={inviting || !inviteList.trim()} onClick={async () => {
                setInviting(true); setInviteResult(null);
                try {
                  const recipientsRaw = inviteList.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
                  const recipients = recipientsRaw.map((email) => ({ email }));
                  const res = await adminPreprovisionInvites({ recipients, campaign, grant_tokens: grantTokens, grant_cash_usd: grantCash, max_redemptions: maxRedemptions, expires_at: expiresAt || undefined } as any);
                  setInviteResult(res);
                } catch (e: any) {
                  setInviteResult({ ok: false, error: e?.response?.data?.error || e?.message });
                } finally { setInviting(false); }
              }} style={{ background: inviting ? '#333' : '#4a90e2', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: 4 }}>{inviting ? 'Sending…' : 'Send Invites'}</button>
              {inviteResult && (<span>{inviteResult.ok ? `Sent: ${inviteResult.count}` : (inviteResult.error || 'Error')}</span>)}
            </div>
            {inviteResult?.results && Array.isArray(inviteResult.results) && (
              <div style={{ marginTop: 8 }}>
                {inviteResult.results.slice(0, 10).map((r: any, i: number) => {
                  const email = r.email || r.to;
                  const status = r.error ? `(${r.error})` : '✓';
                  return (<div key={i} style={{ opacity: r.error ? 0.8 : 1 }}>{email} — {status}</div>);
                })}
                {inviteResult.results.length > 10 && (<div style={{ opacity: 0.8 }}>…and {inviteResult.results.length - 10} more</div>)}
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default AdminEmail;
