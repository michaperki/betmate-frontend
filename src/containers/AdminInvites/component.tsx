import React, { useEffect, useState } from 'react';
import { 
  getInviteCodes,
  getInviteStats,
  createInviteCode,
  createBulkInviteCodes,
  updateInviteCode,
  deleteInviteCode
} from 'store/requests/adminRequests';
import '../../styles/admin.scss';
import DataTable from '../../admin/components/DataTable';

const AdminInvites: React.FC = () => {
  const [codes, setCodes] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true); setErr(null);
    try {
      const [c, s] = await Promise.all([getInviteCodes(), getInviteStats()]);
      setCodes(c.items || c.codes || []);
      setStats(s);
    } catch (e: any) { setErr(e?.message || 'Failed to load invites'); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  return (
    <div className="admin-content">
      <div className="admin-card">
        <div className="admin-card__title"><span>Invite Codes</span><button onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button></div>
        {err && <div style={{ color: '#ef4444' }}>{err}</div>}
        <DataTable
          rows={codes}
          empty="No invite codes"
          defaultSortKey="campaign"
          columns={[
            { key: 'code', header: 'Code' },
            { key: 'campaign', header: 'Campaign' },
            { key: 'uses', header: 'Uses', align: 'right' },
            { key: 'max', header: 'Max', align: 'right' },
            { key: 'active', header: 'Active' },
          ]}
        />
      </div>
    </div>
  );
};

export default AdminInvites;

