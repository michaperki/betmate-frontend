import React, { useEffect, useState } from 'react';
import Header from 'components/Header';
import { NavLink } from 'react-router-dom';
import { 
  getInviteCodes,
  getInviteStats,
  createInviteCode,
  createBulkInviteCodes,
  updateInviteCode,
  deleteInviteCode
} from 'store/requests/adminRequests';
import '../../styles/admin.scss';

// Component for invite code creation form
const CreateInviteForm: React.FC<{ 
  onSuccess: () => void; 
  campaigns: string[];
}> = ({ onSuccess, campaigns }) => {
  const [formData, setFormData] = useState({
    code: '',
    campaign: '',
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
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await createInviteCode(formData);
      setFormData({
        code: '',
        campaign: formData.campaign, // Keep the campaign for convenience
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
                name="campaign"
                value=""
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
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await createBulkInviteCodes(formData);
      setFormData({
        count: 5,
        campaign: formData.campaign, // Keep the campaign for convenience
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
                name="campaign"
                value=""
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
      await updateInviteCode(id, editData);
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
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Code</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Campaign</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Used</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Max</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>K-Bits</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>USD</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #333' }}>Expires</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #333' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.map(code => (
              <tr key={code._id}>
                {editingId === code._id ? (
                  // Edit mode
                  <>
                    <td colSpan={9} style={{ padding: '16px', borderBottom: '1px solid #222' }}>
                      <div style={{ marginBottom: '16px', fontWeight: 'bold' }}>Edit: {code.code}</div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <div style={{ marginBottom: '4px' }}>Campaign</div>
                          <select 
                            value={editData.campaign}
                            onChange={(e) => setEditData(prev => ({ ...prev, campaign: e.target.value }))}
                            style={{ 
                              width: '100%', 
                              padding: '8px', 
                              background: '#1a1a1a', 
                              color: '#fff',
                              border: '1px solid #333',
                              borderRadius: '4px'
                            }}
                          >
                            {campaigns.map(camp => (
                              <option key={camp} value={camp}>{camp}</option>
                            ))}
                            <option value="new">+ New Campaign</option>
                          </select>
                          {editData.campaign === 'new' && (
                            <input
                              type="text"
                              value=""
                              onChange={(e) => setEditData(prev => ({ ...prev, campaign: e.target.value }))}
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
                        
                        <div>
                          <div style={{ marginBottom: '4px' }}>Max Redemptions</div>
                          <input
                            type="number"
                            value={editData.max_redemptions}
                            onChange={(e) => setEditData(prev => ({ ...prev, max_redemptions: parseInt(e.target.value) }))}
                            min={code.redeemed_count || 0}
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
                        
                        <div>
                          <div style={{ marginBottom: '4px' }}>K-Bits (tokens)</div>
                          <input
                            type="number"
                            value={editData.grant_tokens}
                            onChange={(e) => setEditData(prev => ({ ...prev, grant_tokens: parseFloat(e.target.value) }))}
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
                        
                        <div>
                          <div style={{ marginBottom: '4px' }}>BetMate Cash (USD)</div>
                          <input
                            type="number"
                            value={editData.grant_cash_usd}
                            onChange={(e) => setEditData(prev => ({ ...prev, grant_cash_usd: parseFloat(e.target.value) }))}
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
                        
                        <div>
                          <div style={{ marginBottom: '4px' }}>Expiration Date</div>
                          <input
                            type="date"
                            value={editData.expires_at}
                            onChange={(e) => setEditData(prev => ({ ...prev, expires_at: e.target.value }))}
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
                        
                        <div>
                          <div style={{ marginBottom: '4px' }}>Status</div>
                          <div style={{ padding: '8px 0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={editData.active}
                                onChange={(e) => setEditData(prev => ({ ...prev, active: e.target.checked }))}
                              />
                              <span>Active</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {error && (
                        <div style={{ color: '#e74c3c', marginBottom: '16px', fontSize: '14px' }}>
                          {error}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={handleCancelEdit}
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
                          onClick={() => handleUpdateCode(code._id)}
                          disabled={loading}
                          style={{ 
                            padding: '8px 16px', 
                            background: '#3498db', 
                            border: 'none', 
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {loading ? 'Updating...' : 'Update Code'}
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // View mode
                  <>
                    <td style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #222' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>{code.code}</div>
                    </td>
                    <td style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #222' }}>{code.campaign}</td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #222' }}>{code.redeemed_count || 0}</td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #222' }}>{code.max_redemptions}</td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #222' }}>{code.grant_tokens || 0}</td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #222' }}>${code.grant_cash_usd || 0}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #222' }}>
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #222' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: code.active ? '#2ecc7133' : '#e74c3c33',
                        color: code.active ? '#2ecc71' : '#e74c3c'
                      }}>
                        {code.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #222' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => handleToggleActive(code._id, code.active)}
                          disabled={loading}
                          title={code.active ? 'Deactivate' : 'Activate'}
                          style={{ 
                            padding: '4px 8px', 
                            background: code.active ? '#e74c3c33' : '#2ecc7133', 
                            border: 'none', 
                            borderRadius: '4px',
                            color: code.active ? '#e74c3c' : '#2ecc71',
                            cursor: loading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {code.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleEdit(code)}
                          disabled={loading}
                          title="Edit"
                          style={{ 
                            padding: '4px 8px', 
                            background: '#3498db33', 
                            border: 'none', 
                            borderRadius: '4px',
                            color: '#3498db',
                            cursor: loading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCode(code._id)}
                          disabled={loading}
                          title="Delete"
                          style={{ 
                            padding: '4px 8px', 
                            background: '#e74c3c33', 
                            border: 'none', 
                            borderRadius: '4px',
                            color: '#e74c3c',
                            cursor: loading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Filter component for invite codes
const InviteFilters: React.FC<{ 
  campaigns: string[];
  filters: { campaign?: string; active?: boolean };
  onChange: (filters: any) => void;
  onRefresh: () => void;
}> = ({ campaigns, filters, onChange, onRefresh }) => {
  return (
    <div className="admin-card">
      <div className="admin-card__title">
        <span>Filters</span>
        <button 
          onClick={onRefresh}
          style={{ background: 'none', border: 'none', color: '#4a90e2', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ marginBottom: '4px' }}>Campaign</div>
          <select 
            value={filters.campaign || ''}
            onChange={(e) => onChange({ ...filters, campaign: e.target.value || undefined })}
            style={{ 
              padding: '8px', 
              background: '#1a1a1a', 
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '4px'
            }}
          >
            <option value="">All Campaigns</option>
            {campaigns.map(camp => (
              <option key={camp} value={camp}>{camp}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ marginBottom: '4px' }}>Status</div>
          <select 
            value={filters.active === undefined ? '' : String(filters.active)}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ 
                ...filters, 
                active: val === '' ? undefined : val === 'true'
              });
            }}
            style={{ 
              padding: '8px', 
              background: '#1a1a1a', 
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '4px'
            }}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={() => onChange({})}
            style={{ 
              padding: '8px 16px', 
              background: '#333', 
              border: 'none', 
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

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
        </div>
        
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