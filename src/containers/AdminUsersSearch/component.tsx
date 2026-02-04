import React, { useEffect, useState } from 'react';
import '../../styles/admin.scss';
import { adminSearchUsers, adminAdjustBalance, adminUpdateUserRole, adminResendVerification, adminDeleteUser } from 'store/requests/adminRequests';

const AdminUsersSearch: React.FC = () => {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Array<any>>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [adjCurrency, setAdjCurrency] = useState<'USDT'|'BET'>('USDT');
  const [adjDelta, setAdjDelta] = useState<number>(0);
  const [adjReason, setAdjReason] = useState<string>('');
  const [roleEdit, setRoleEdit] = useState<string>('user');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [deleteCascade, setDeleteCascade] = useState<boolean>(true);

  const search = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminSearchUsers(q, 50, 0);
      setRows(res.users || []);
    } catch (e: any) {
      setErr(e?.message || 'Search failed');
    } finally { setLoading(false); }
  };

  useEffect(() => { /* initial noop */ }, []);

  return (
    <div className="admin-content">
      <div className="admin-card" style={{ marginTop: 0 }}>
        <div className="admin-card__title"><span>User Search</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or user id" style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', minWidth: 280 }} />
          <button onClick={search} disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
          {err && <span style={{ color: '#ef4444' }}>{err}</span>}
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 16 }}>
        {!rows.length ? (
          <div style={{ opacity: 0.7 }}>No users</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>KYC</th>
                <th>Email</th>
                <th style={{ textAlign: 'right' }}>Cash</th>
                <th style={{ textAlign: 'right' }}>K-Bits</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u._id}>
                  <td><button onClick={() => setProfile(u)} style={{ background: 'none', color: '#4a90e2', border: 0, padding: 0, cursor: 'pointer' }}>{u.email}</button></td>
                  <td>{u.role}</td>
                  <td>{u.kyc_status || 'none'}</td>
                  <td>{u.email_verified ? 'verified' : 'unverified'}</td>
                  <td style={{ textAlign: 'right' }}>${Number(u.cash_balance || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{Number(u.token_balance || 0).toFixed(0)}</td>
                  <td style={{ textAlign: 'right' }}><a href={`/admin/users/ledger?id=${encodeURIComponent(u._id)}`} style={{ color: '#4a90e2', textDecoration: 'none' }}>View ledger →</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {profile && (
        <div style={{ position: 'fixed', right: 12, top: 72, width: 360, background: '#0b0b0b', border: '1px solid #1f2937', borderRadius: 8, padding: 16, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>User Profile</div>
            <button onClick={() => setProfile(null)} style={{ marginLeft: 'auto' }}>×</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Email</span><span>{profile.email}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Role</span><span>{profile.role}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>KYC</span><span>{profile.kyc_status}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Email Verified</span><span>{profile.email_verified ? 'Yes' : 'No'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Cash</span><span>${Number(profile.cash_balance || 0).toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>K-Bits</span><span>{Number(profile.token_balance || 0).toFixed(0)}</span></div>
            {profile.signup_ip && <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Signup IP</span><span>{profile.signup_ip}</span></div>}
            {profile.signup_user_agent && <div style={{ margin: '6px 0' }}>
              <div>User Agent</div>
              <div style={{ opacity: 0.8, wordBreak: 'break-word' }}>{profile.signup_user_agent}</div>
            </div>}
            {profile.signup_device_id && <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Device ID</span><span>{profile.signup_device_id}</span></div>}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <a href={`/admin/users/ledger?id=${encodeURIComponent(profile._id)}`} style={{ color: '#4a90e2', textDecoration: 'none' }}>Open Ledger →</a>
            </div>
            <div style={{ borderTop: '1px solid #1f2937', marginTop: 12, paddingTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Account Actions</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={adjCurrency} onChange={(e) => setAdjCurrency(e.target.value as any)}>
                  <option value="USDT">USDT</option>
                  <option value="BET">BET</option>
                </select>
                <input type="number" step={0.01} placeholder="Amount (+/-)" value={adjDelta} onChange={(e) => setAdjDelta(Number(e.target.value || 0))} />
                <input type="text" placeholder="Reason" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
                <button disabled={busy || !adjDelta} onClick={async () => { setBusy(true); try { await adminAdjustBalance(profile._id, { currency: adjCurrency, delta: adjDelta, reason: adjReason || undefined }); alert('Balance updated'); } catch (e: any) { alert(e?.response?.data?.error || 'Failed'); } finally { setBusy(false); } }}>Apply</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                <label>Role</label>
                <select value={roleEdit} onChange={(e) => setRoleEdit(e.target.value)}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <button disabled={busy} onClick={async () => { setBusy(true); try { await adminUpdateUserRole(profile._id, roleEdit as any); alert('Role updated'); } catch (e: any) { alert(e?.response?.data?.error || 'Failed'); } finally { setBusy(false); } }}>Update</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                <button disabled={busy} onClick={async () => { setBusy(true); try { await adminResendVerification(profile.email); alert('Verification email sent (if eligible)'); } catch (e: any) { alert(e?.response?.data?.error || 'Failed'); } finally { setBusy(false); } }}>Resend verification</button>
              </div>
              <div style={{ borderTop: '1px solid #1f2937', marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Danger Zone</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={deleteCascade} onChange={(e) => setDeleteCascade(e.target.checked)} />
                    Also delete wagers/ledger (cascade)
                  </label>
                  <button disabled={busy} style={{ background: '#7f1d1d', border: '1px solid #ef4444', color: '#fff' }} onClick={async () => {
                    if (!window.confirm('Delete this account? This cannot be undone.')) return;
                    setBusy(true);
                    try {
                      await adminDeleteUser(profile._id, { cascade: deleteCascade });
                      alert('Account deleted');
                      setProfile(null);
                      // Refresh results
                      try { await search(); } catch {}
                    } catch (e: any) {
                      alert(e?.response?.data?.error || 'Delete failed');
                    } finally { setBusy(false); }
                  }}>Delete Account</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersSearch;
