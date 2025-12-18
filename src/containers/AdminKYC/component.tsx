import React, { useEffect, useState } from 'react';
import NavBar from 'components/NavBar';
import { NavLink } from 'react-router-dom';
import VersionFooter from 'components/VersionFooter';
import '../../styles/admin.scss';
import { getKycUsers, approveKycUser, rejectKycUser } from 'store/requests/adminRequests';

const AdminKYC: React.FC = () => {
  const [status, setStatus] = useState<string>('pending');
  const [limit, setLimit] = useState<number>(100);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await getKycUsers({ status, limit });
      setRows(data.users || []);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load KYC users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="dashboard-page admin-content">
      <NavBar />
      <div style={{ padding: 24 }}>
        <div className="admin-tabs">
          <NavLink to="/admin">Home</NavLink>
          <NavLink to="/admin/risk">Risk</NavLink>
          <NavLink to="/admin/wallet">Wallet</NavLink>
          <NavLink to="/admin/kyc">KYC</NavLink>
          <NavLink to="/admin/ops">Ops</NavLink>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Admin — KYC</h2>
          <button onClick={refresh} disabled={loading} style={{ marginLeft: 'auto' }}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="required">Required</option>
            <option value="none">None</option>
          </select>
          <input type="number" min={1} max={500} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
          <button onClick={refresh} disabled={loading}>Apply</button>
        </div>
        {err && <div style={{ color: '#b91c1c', marginTop: 8 }}>{err}</div>}
        <div style={{ marginTop: 16 }}>
          {!rows.length ? (
            <div>No users found</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 8 }}>
              <div style={{ fontWeight: 600 }}>Email</div>
              <div style={{ fontWeight: 600 }}>Role</div>
              <div style={{ fontWeight: 600 }}>KYC</div>
              <div style={{ fontWeight: 600 }}>Actions</div>
              {rows.map((u) => (
                <React.Fragment key={u._id}>
                  <div>{u.email}</div>
                  <div>{u.role}</div>
                  <div>{u.kyc_status || 'none'}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button disabled={loading} onClick={async () => { await approveKycUser(u._id); refresh(); }}>Approve</button>
                    <button disabled={loading} onClick={async () => { await rejectKycUser(u._id); refresh(); }}>Reject</button>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
      <VersionFooter />
    </div>
  );
};

export default AdminKYC;

