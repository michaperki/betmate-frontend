import React, { useEffect, useState } from 'react';
// Header/tabs removed; AdminLayout provides chrome
import { 
  getInviteCodes,
  getInviteStats,
  createInviteCode,
  createBulkInviteCodes,
  updateInviteCode,
  deleteInviteCode
} from 'store/requests/adminRequests';
import '../../styles/admin.scss';
import StatusBadge from '../../admin/components/StatusBadge';
import DataTable from '../../admin/components/DataTable';
import Toolbar from '../../admin/components/Toolbar';

// Component for invite code creation form
const CreateInviteForm: React.FC<{ 
  onSuccess: () => void; 
  campaigns: string[];
}> = ({ onSuccess, campaigns }) => {
  const [formData, setFormData] = useState({
    code: '',
    campaign: '',
    // When selecting "+ New Campaign" from the dropdown, hold the typed name separately
    newCampaignName: '',
    max_redemptions: 1,
    expires_at: '',
    grant_tokens: 0,
    grant_cash_usd: 0,
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
      return;
    }

    // Distinguish between selecting "new" vs typing the new name
    if (name === 'campaign') {
      setFormData(prev => ({ ...prev, campaign: value }));
      return;
    }
    if (name === 'newCampaignName') {
      setFormData(prev => ({ ...prev, newCampaignName: value }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const finalCampaign = formData.campaign === 'new' ? formData.newCampaignName.trim() : formData.campaign.trim();
      if (!finalCampaign) {
        setLoading(false);
        setError('Please enter a campaign name');
        return;
      }
      await createInviteCode({
        code: formData.code || undefined,
        campaign: finalCampaign,
        max_redemptions: formData.max_redemptions,
        expires_at: formData.expires_at || undefined,
        grant_tokens: formData.grant_tokens || undefined,
        grant_cash_usd: formData.grant_cash_usd || undefined,
        active: formData.active,
      });
      setFormData({
        code: '',
        campaign: formData.campaign, // keep selection (existing or 'new')
        newCampaignName: '',
        max_redemptions: 1,
        expires_at: '',
        grant_tokens: 0,
        grant_cash_usd: 0,
        active: true
      });
      onSuccess();
      setShowForm(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-card__title">
        <span>Create Invite Code</span>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={{ background: 'none', border: 'none', color: '#4a90e2', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : 'Create New'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '4px' }}>Campaign *</div>
            {campaigns.length > 0 ? (
              <select 
                name="campaign"
                value={formData.campaign}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: '#1a1a1a', 
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select a campaign</option>
                {campaigns.map(camp => (
                  <option key={camp} value={camp}>{camp}</option>
                ))}
                <option value="new">+ New Campaign</option>
              </select>
            ) : (
              <input
                type="text"
                name="campaign"
                value={formData.campaign}
                onChange={handleChange}
                placeholder="Campaign name (e.g. beta, influencer)"
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: '#1a1a1a', 
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              />
            )}
            {formData.campaign === 'new' && (
              <input
                type="text"
                name="newCampaignName"
                value={formData.newCampaignName}
                onChange={handleChange}
                placeholder="Enter new campaign name"
                required
                style={{ 
                  width: '100%', 
                  marginTop: '8px',
                  padding: '8px', 
                  background: '#1a1a1a', 
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              />
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '4px' }}>Code (optional)</div>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Leave blank for auto-generated code"
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#1a1a1a', 
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '4px' }}>Max Redemptions</div>
            <input
              type="number"
              name="max_redemptions"
              value={formData.max_redemptions}
              onChange={handleChange}
              min={1}
              required
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#1a1a1a', 
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '4px' }}>Expiration Date (optional)</div>
            <input
              type="date"
              name="expires_at"
              value={formData.expires_at}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#1a1a1a', 
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '4px' }}>Rewards</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>K-Bits (tokens)</div>
                <input
                  type="number"
                  name="grant_tokens"
                  value={formData.grant_tokens}
                  onChange={handleChange}
                  min={0}
                  step={100}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    background: '#1a1a1a', 
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>BetMate Cash (USD)</div>
                <input
                  type="number"
                  name="grant_cash_usd"
                  value={formData.grant_cash_usd}
                  onChange={handleChange}
                  min={0}
                  step={1}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    background: '#1a1a1a', 
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              />
              <span>Active</span>
            </label>
          </div>

          {error && (
            <div style={{ color: '#e74c3c', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ 
                padding: '8px 16px', 
                background: '#333', 
                border: 'none', 
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ 
                padding: '8px 16px', 
                background: '#2ecc71', 
                border: 'none', 
                borderRadius: '4px',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Invite Code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// Component for bulk invite code creation
const BulkCreateForm: React.FC<{ 
  onSuccess: () => void; 
  campaigns: string[];
}> = ({ onSuccess, campaigns }) => {
  const [formData, setFormData] = useState({
    count: 5,
    campaign: '',
    newCampaignName: '',
    max_redemptions: 1,
    expires_at: '',
    grant_tokens: 0,
    grant_cash_usd: 0,
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
      return;
    }
    if (name === 'campaign') {
      setFormData(prev => ({ ...prev, campaign: value }));
      return;
    }
    if (name === 'newCampaignName') {
      setFormData(prev => ({ ...prev, newCampaignName: value }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const finalCampaign = formData.campaign === 'new' ? formData.newCampaignName.trim() : formData.campaign.trim();
      if (!finalCampaign) {
        setLoading(false);
        setError('Please enter a campaign name');
        return;
      }
      await createBulkInviteCodes({
        count: formData.count,
        campaign: finalCampaign,
        max_redemptions: formData.max_redemptions,
        expires_at: formData.expires_at || undefined,
        grant_tokens: formData.grant_tokens || undefined,
        grant_cash_usd: formData.grant_cash_usd || undefined,
        active: formData.active,
      });
      setFormData({
        count: 5,
        campaign: formData.campaign,
        newCampaignName: '',
        max_redemptions: 1,
        expires_at: '',
        grant_tokens: 0,
        grant_cash_usd: 0,
        active: true
      });
      onSuccess();
      setShowForm(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create invite codes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-card__title">
        <span>Bulk Create Invite Codes</span>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={{ background: 'none', border: 'none', color: '#4a90e2', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : 'Bulk Create'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '4px' }}>Number of Codes</div>
            <input
              type="number"
              name="count"
              value={formData.count}
              onChange={handleChange}
              min={1}
              max={100}
              required
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#1a1a1a', 
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '4px' }}>Campaign *</div>
            {campaigns.length > 0 ? (
              <select 
                name="campaign"
                value={formData.campaign}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: '#1a1a1a', 
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select a campaign</option>
                {campaigns.map(camp => (
                  <option key={camp} value={camp}>{camp}</option>
                ))}
                <option value="new">+ New Campaign</option>
              </select>
            ) : (
              <input
                type="text"
                name="campaign"
                value={formData.campaign}
                onChange={handleChange}
                placeholder="Campaign name (e.g. beta, influencer)"
                required
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: '#1a1a1a', 
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              />
            )}
            {formData.campaign === 'new' && (
              <input
                type="text"
                name="newCampaignName"
                value={formData.newCampaignName}
                onChange={handleChange}
                placeholder="Enter new campaign name"
                required
                style={{ 
                  width: '100%', 
                  marginTop: '8px',
                  padding: '8px', 
                  background: '#1a1a1a', 
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px'
                }}
              />
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '4px' }}>Max Redemptions Per Code</div>
            <input
              type="number"
              name="max_redemptions"
              value={formData.max_redemptions}
              onChange={handleChange}
              min={1}
              required
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#1a1a1a', 
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '4px' }}>Expiration Date (optional)</div>
            <input
              type="date"
              name="expires_at"
              value={formData.expires_at}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                background: '#1a1a1a', 
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '4px' }}>Rewards</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>K-Bits (tokens)</div>
                <input
                  type="number"
                  name="grant_tokens"
                  value={formData.grant_tokens}
                  onChange={handleChange}
                  min={0}
                  step={100}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    background: '#1a1a1a', 
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>BetMate Cash (USD)</div>
                <input
                  type="number"
                  name="grant_cash_usd"
                  value={formData.grant_cash_usd}
                  onChange={handleChange}
                  min={0}
                  step={1}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    background: '#1a1a1a', 
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={e => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              />
              <span>Active</span>
            </label>
          </div>

          {error && (
            <div style={{ color: '#e74c3c', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ 
                padding: '8px 16px', 
                background: '#333', 
                border: 'none', 
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ 
                padding: '8px 16px', 
                background: '#2ecc71', 
                border: 'none', 
                borderRadius: '4px',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : `Create ${formData.count} Codes`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// Stats component
const InviteStats: React.FC<{ stats: any }> = ({ stats }) => {
  if (!stats) return null;
  
  const { overall, campaigns } = stats;
  
  return (
    <div className="admin-card">
      <div className="admin-card__title">Invite Stats</div>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Overall</div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '150px' }}>
            <div style={{ opacity: 0.7, fontSize: '12px' }}>Total Codes</div>
            <div style={{ fontSize: '18px' }}>{overall?.totalCodes || 0}</div>
          </div>
          <div style={{ minWidth: '150px' }}>
            <div style={{ opacity: 0.7, fontSize: '12px' }}>Active Codes</div>
            <div style={{ fontSize: '18px' }}>{overall?.activeCodes || 0}</div>
          </div>
          <div style={{ minWidth: '150px' }}>
            <div style={{ opacity: 0.7, fontSize: '12px' }}>Redemptions</div>
            <div style={{ fontSize: '18px' }}>{overall?.totalRedemptions || 0}</div>
          </div>
          <div style={{ minWidth: '150px' }}>
            <div style={{ opacity: 0.7, fontSize: '12px' }}>K-Bits Granted</div>
            <div style={{ fontSize: '18px' }}>{overall?.tokensGranted || 0}</div>
          </div>
          <div style={{ minWidth: '150px' }}>
            <div style={{ opacity: 0.7, fontSize: '12px' }}>Cash Granted (USD)</div>
            <div style={{ fontSize: '18px' }}>${overall?.cashGranted || 0}</div>
          </div>
        </div>
      </div>
      
      {campaigns && campaigns.length > 0 && (
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>By Campaign</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Campaign</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Codes</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Active</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Redemptions</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>K-Bits</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Cash ($)</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign: any) => (
                <tr key={campaign._id}>
                  <td style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #222' }}>{campaign._id}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #222' }}>{campaign.totalCodes}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #222' }}>{campaign.activeCodes}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #222' }}>{campaign.totalRedemptions}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #222' }}>{campaign.tokensGranted}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #222' }}>${campaign.cashGranted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Main invite code list component
const InviteCodeList: React.FC<{ 
  codes: any[]; 
  onRefresh: () => void;
  campaigns: string[];
}> = ({ codes, onRefresh, campaigns }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEdit = (code: any) => {
    setEditingId(code._id);
    setEditData({
      campaign: code.campaign,
      newCampaignName: '',
      max_redemptions: code.max_redemptions,
      expires_at: code.expires_at ? new Date(code.expires_at).toISOString().split('T')[0] : '',
      grant_tokens: code.grant_tokens,
      grant_cash_usd: code.grant_cash_usd,
      active: code.active
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setError('');
  };

  const handleUpdateCode = async (id: string) => {
    setLoading(true);
    setError('');
    
    try {
      const update: any = { ...editData };
      if (editData.campaign === 'new') {
        const final = (editData.newCampaignName || '').trim();
        if (!final) {
          setLoading(false);
          setError('Please enter a campaign name');
          return;
        }
        update.campaign = final;
      }
      delete update.newCampaignName;
      await updateInviteCode(id, update);
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invite code?')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteInviteCode(id);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setLoading(true);
    try {
      await updateInviteCode(id, { active: !currentActive });
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteLink = async (codeStr: string) => {
    try {
      const url = new URL('/onboarding', window.location.origin);
      url.searchParams.set('code', codeStr);
      const link = url.toString();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const ta = document.createElement('textarea');
        ta.value = link;
        ta.style.position = 'fixed';
        ta.style.left = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
      }
      alert('Invite link copied to clipboard');
    } catch (e) {
      alert('Failed to copy invite link');
    }
  };

  if (!codes.length) {
    return (
      <div className="admin-card">
        <div className="admin-card__title">Invite Codes</div>
        <div style={{ padding: '16px 0', textAlign: 'center', opacity: 0.7 }}>
          No invite codes found. Create your first code.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="admin-card__title">Invite Codes</div>
      <DataTable
        rows={codes as any}
        empty="No invite codes found. Create your first code."
        defaultSortKey="code"
        className="admin-table sticky compact"
        columns={[
          { key: 'code', header: 'Code', sort: true, render: (c: any) => <span style={{ fontFamily: 'monospace' }}>{c.code}</span> },
          { key: 'campaign', header: 'Campaign', sort: true, render: (c: any) => (
            editingId === c._id ? (
              <>
                <select value={editData.campaign} onChange={(e) => setEditData(prev => ({ ...prev, campaign: e.target.value }))}>
                  {campaigns.map((camp: string) => (<option key={camp} value={camp}>{camp}</option>))}
                  <option value="new">+ New Campaign</option>
                </select>
                {editData.campaign === 'new' && (
                  <input type="text" value={editData.newCampaignName || ''} onChange={(e) => setEditData(prev => ({ ...prev, newCampaignName: e.target.value }))} placeholder="New campaign" />
                )}
              </>
            ) : c.campaign
          ) },
          { key: 'redeemed_count', header: 'Used', align: 'right', sort: true },
          { key: 'max_redemptions', header: 'Max', align: 'right', sort: true, render: (c: any) => (
            editingId === c._id ? (
              <input type="number" value={editData.max_redemptions} onChange={(e) => setEditData(prev => ({ ...prev, max_redemptions: parseInt(e.target.value) }))} />
            ) : c.max_redemptions
          ) },
          { key: 'grant_tokens', header: 'K-Bits', align: 'right', sort: true, render: (c: any) => (
            editingId === c._id ? (
              <input type="number" value={editData.grant_tokens} onChange={(e) => setEditData(prev => ({ ...prev, grant_tokens: parseFloat(e.target.value) }))} />
            ) : (c.grant_tokens || 0)
          ) },
          { key: 'grant_cash_usd', header: 'USD', align: 'right', sort: true, render: (c: any) => (
            editingId === c._id ? (
              <input type="number" value={editData.grant_cash_usd} onChange={(e) => setEditData(prev => ({ ...prev, grant_cash_usd: parseFloat(e.target.value) }))} />
            ) : `$${c.grant_cash_usd || 0}`
          ) },
          { key: 'expires_at', header: 'Expires', align: 'center', render: (c: any) => (
            editingId === c._id ? (
              <input type="date" value={editData.expires_at} onChange={(e) => setEditData(prev => ({ ...prev, expires_at: e.target.value }))} />
            ) : (c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—')
          ) },
          { key: 'active', header: 'Status', align: 'center', sort: true, render: (c: any) => (
            editingId === c._id ? (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={!!editData.active} onChange={(e) => setEditData(prev => ({ ...prev, active: e.target.checked }))} /> Active
              </label>
            ) : (
              <StatusBadge status={c.active ? 'active' : 'inactive'} />
            )
          ) },
          { key: 'actions', header: 'Actions', align: 'right', render: (c: any) => (
            editingId === c._id ? (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={handleCancelEdit}>Cancel</button>
                <button onClick={() => handleUpdateCode(c._id)} disabled={loading}>{loading ? 'Updating…' : 'Update'}</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => handleToggleActive(c._id, c.active)} disabled={loading}>{c.active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => handleCopyInviteLink(c.code)} disabled={loading}>Copy Link</button>
                <button onClick={() => handleEdit(c)} disabled={loading}>Edit</button>
                <ConfirmButton confirm={`Delete invite code ${c.code}?`} onConfirm={() => handleDeleteCode(c._id)} disabled={loading}>Delete</ConfirmButton>
              </div>
            )
          ) },
        ]}
      />
    </div>
  );
};

// Filter component for invite codes
const InviteFilters: React.FC<{ campaigns: string[]; filters: { campaign?: string; active?: boolean }; onChange: (filters: any) => void; onRefresh: () => void; onExport: () => void; }> = ({ campaigns, filters, onChange, onRefresh, onExport }) => (
  <div className="admin-card">
    <div className="admin-card__title"><span>Filters</span></div>
    <Toolbar
      left={(
        <>
          <select value={filters.campaign || ''} onChange={(e) => onChange({ ...filters, campaign: e.target.value || undefined })}>
            <option value="">All Campaigns</option>
            {campaigns.map(camp => (<option key={camp} value={camp}>{camp}</option>))}
          </select>
          <select
            value={filters.active === undefined ? '' : String(filters.active)}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ ...filters, active: val === '' ? undefined : val === 'true' });
            }}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button onClick={() => onChange({})}>Clear Filters</button>
        </>
      )}
      right={(
        <>
          <button onClick={onRefresh}>Apply</button>
          <button onClick={onExport}>Export CSV</button>
        </>
      )}
    />
  </div>
);

// Main admin invites component
const AdminInvites: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [inviteCodes, setInviteCodes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    limit: 50,
    skip: 0,
    total: 0,
    hasMore: false
  });
  const [filters, setFilters] = useState<{
    campaign?: string;
    active?: boolean;
  }>({});

  const exportCodes = () => {
    try {
      const headers = ['code','campaign','redeemed_count','max_redemptions','grant_tokens','grant_cash_usd','expires_at','active'];
      const lines = [headers.join(',')];
      for (const c of inviteCodes) {
        const row = [c.code, c.campaign, c.redeemed_count, c.max_redemptions, c.grant_tokens || 0, c.grant_cash_usd || 0, c.expires_at ? new Date(c.expires_at).toISOString().slice(0,10) : '', c.active];
        const line = row.map((v) => {
          const s = v == null ? '' : String(v);
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(',');
        lines.push(line);
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'invite_codes.csv'; a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [codesResponse, statsResponse] = await Promise.all([
        getInviteCodes({ 
          campaign: filters.campaign,
          active: filters.active,
          limit: pagination.limit,
          skip: pagination.skip
        }),
        getInviteStats()
      ]);
      
      setInviteCodes(codesResponse.codes || []);
      setPagination(codesResponse.pagination || {
        limit: 50,
        skip: 0,
        total: 0,
        hasMore: false
      });
      setCampaigns(codesResponse.filters?.campaigns || []);
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading invite data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters, pagination.skip, pagination.limit]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    // Reset pagination when filters change
    setPagination(prev => ({
      ...prev,
      skip: 0
    }));
  };

  const handleLoadMore = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        skip: prev.skip + prev.limit
      }));
    }
  };

  return (
    <div className="admin-content">
      <div style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        <div style={{ fontSize: 20, fontWeight: 700 }}>Admin — Invite Codes</div>
        
        {loading && inviteCodes.length === 0 ? (
          <div className="admin-card">
            <div style={{ padding: '24px', textAlign: 'center' }}>
              Loading invite data...
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <CreateInviteForm 
                  onSuccess={loadData} 
                  campaigns={campaigns}
                />
              </div>
              <div style={{ flex: '1 1 300px' }}>
                <BulkCreateForm 
                  onSuccess={loadData} 
                  campaigns={campaigns}
                />
              </div>
            </div>
            
            <InviteStats stats={stats} />
            
            <InviteFilters 
              campaigns={campaigns}
              filters={filters}
              onChange={handleFilterChange}
              onRefresh={loadData}
              onExport={exportCodes}
            />
            
            <InviteCodeList 
              codes={inviteCodes} 
              onRefresh={loadData}
              campaigns={campaigns}
            />
            
            {pagination.hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                <button
                  onClick={handleLoadMore}
                  style={{ 
                    padding: '8px 16px', 
                    background: '#3498db', 
                    border: 'none', 
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminInvites;
