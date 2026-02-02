import React, { useEffect, useState } from 'react';
import '../../styles/admin.scss';
import { getKycUsers, approveKycUser, rejectKycUser } from 'store/requests/adminRequests';
import DataTable from '../../admin/components/DataTable';
import StatusBadge from '../../admin/components/StatusBadge';
import Toolbar from '../../admin/components/Toolbar';
import ConfirmButton from '../../admin/components/ConfirmButton';

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
    <div className="admin-content">
      <div style={{ padding: 0 }}>
        <div className="admin-card" style={{ marginTop: 0 }}>
          <div className="admin-card__title"><span>KYC Queue</span></div>
          <Toolbar
            left={(
              <>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="required">Required</option>
                  <option value="none">None</option>
                </select>
                <input type="number" min={1} max={500} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
              </>
            )}
            right={(
              <>
                <button onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Apply'}</button>
              </>
            )}
          />
          {err && <div style={{ color: '#b91c1c', marginTop: 8 }}>{err}</div>}
        </div>

        <div className="admin-card" style={{ marginTop: 16 }}>
          <DataTable
            rows={rows}
            empty="No users found"
            columns={[
              { key: 'email', header: 'Email', sort: true },
              { key: 'role', header: 'Role' },
              { key: 'kyc_status', header: 'KYC', render: (u: any) => <StatusBadge status={u.kyc_status} /> },
              { key: 'actions', header: 'Actions', render: (u: any) => (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <ConfirmButton
                    disabled={loading}
                    confirm={`Approve KYC for ${u.email}?`}
                    onConfirm={async () => { await approveKycUser(u._id); refresh(); }}
                  >
                    Approve
                  </ConfirmButton>
                  <ConfirmButton
                    disabled={loading}
                    confirm={`Reject KYC for ${u.email}?`}
                    onConfirm={async () => { await rejectKycUser(u._id); refresh(); }}
                  >
                    Reject
                  </ConfirmButton>
                </div>
              ) },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminKYC;

// Ensure module under isolatedModules
export {};
