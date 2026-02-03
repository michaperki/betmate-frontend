import React, { useEffect, useState } from 'react';
import { getAdminFeatures, updateAdminFeatures, getAdminHome, getAdminPaymentVolumeDaily } from 'store/requests/adminRequests';
import '../../styles/admin.scss';
import Card from '../../admin/components/Card';
import KPICard from '../../admin/components/KPICard';
import FeatureSection from '../../admin/components/FeatureSection';

const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
  }}>
    <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    <span>{label}</span>
  </label>
);

const Row: React.FC<{ k: string; v: any }> = ({ k, v }) => (
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
  const [daily, setDaily] = useState<{ deposits: Array<{ date: string; count: number }>; withdrawals: Array<{ date: string; count: number }> } | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [f, h, d] = await Promise.all([getAdminFeatures(), getAdminHome(), getAdminPaymentVolumeDaily(14)]);
      setFeatures(f);
      setHome(h);
      const depSeries = (d.deposits || []).reduce((acc: Record<string, number>, row: any) => {
        const key = String(row.date).slice(0, 10);
        acc[key] = (acc[key] || 0) + (row.count || 0);
        return acc;
      }, {});
      const wdlSeries = (d.withdrawals || []).reduce((acc: Record<string, number>, row: any) => {
        const key = String(row.date).slice(0, 10);
        acc[key] = (acc[key] || 0) + (row.count || 0);
        return acc;
      }, {});
      const days: string[] = Array.from({ length: d.days }, (_, i) => {
        const dt = new Date(Date.parse(d.since) + i * 24 * 60 * 60 * 1000);
        return dt.toISOString().slice(0, 10);
      });
      setDaily({
        deposits: days.map(day => ({ date: day, count: depSeries[day] || 0 })),
        withdrawals: days.map(day => ({ date: day, count: wdlSeries[day] || 0 })),
      });
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

  if (loading) return (<div className="admin-content"><div>Loading admin…</div></div>);

  return (
    <div className="admin-content">
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard
          title="Bankroll"
          value={`$${(home?.risk?.bankroll || 0).toLocaleString()}`}
          subtitle="Available funds"
          icon="$"
          iconColor="#34d399"
          iconBg="rgba(16,185,129,0.12)"
          badge="Bank"
        />
        <KPICard
          title="Global Exposure"
          value={`$${(home?.risk?.globalExposure || 0).toLocaleString()}`}
          subtitle="Global Exposure"
          icon="!"
          iconColor="#f59e0b"
          iconBg="rgba(245,158,11,0.12)"
          badge={`${Math.min(100, Math.round(((home?.risk?.globalExposure || 0) / Math.max(1, (home?.risk?.bankroll || 0) * 0.5)) * 100))}%`}
          progress={Math.min(100, Math.round(((home?.risk?.globalExposure || 0) / Math.max(1, (home?.risk?.bankroll || 0) * 0.5)) * 100))}
        />
        <KPICard
          title="Deposits"
          value={(daily?.deposits || []).slice(-1)[0]?.count || (home?.payments?.confirmed24h ?? 0)}
          subtitle="Deposits (24h)"
          icon="↓"
          iconColor="#60a5fa"
          iconBg="rgba(59,130,246,0.12)"
          badge="24h"
          sparkValues={(daily?.deposits || []).map((d) => d.count)}
          prefix="$"
        />
        <KPICard
          title="Withdrawals"
          value={(daily?.withdrawals || []).slice(-1)[0]?.count || 0}
          subtitle="Withdrawals (24h)"
          icon="↑"
          iconColor="#a78bfa"
          iconBg="rgba(139,92,246,0.12)"
          badge="24h"
          sparkValues={(daily?.withdrawals || []).map((d) => d.count)}
          sparkColor="#8b5cf6"
          sparkFill="rgba(139,92,246,0.15)"
          prefix="$"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <Card title="Environment">
          {home?.env && (<>
            <Row k="Env" v={home.env.nodeEnv} />
            <Row k="Version" v={home.env.version} />
            <Row k="Commit" v={home.env.commit} />
            <Row k="Release" v={home.env.release} />
            <Row k="Uptime (s)" v={Math.round((home.env.uptimeMs || 0) / 1000)} />
            <Row k="Payments" v={home.env.provider} />
          </>)}
        </Card>
        <Card title="Feature Flags">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FeatureSection
              title="Safety Features"
              category="safety"
              features={[
                { key: 'requireKyc', label: 'Require KYC', value: !!features.requireKyc, description: 'Restrict real-money operations to KYC verified users only', category: 'safety', impact: 'high' },
                { key: 'requireEmailVerification', label: 'Require Email Verification', value: !!features.requireEmailVerification, description: 'Enforce email verification before allowing operations', category: 'safety', impact: 'medium' },
                { key: 'enableRateLimiting', label: 'Rate Limiting', value: !!features.enableRateLimiting, description: 'Prevent API abuse by limiting request frequency', category: 'safety', impact: 'medium' },
              ]}
              onChange={(key, value) => patch({ [key]: value })}
            />
            <FeatureSection
              title="Growth Features"
              category="growth"
              features={[
                { key: 'realModeEnabled', label: 'Real Mode', value: !!features.realModeEnabled, description: 'Enable real-money operations platform-wide', category: 'growth', impact: 'high' },
                { key: 'enableFaucet', label: 'Faucet', value: !!features.enableFaucet, description: 'Allow development faucet for tokens', category: 'growth', impact: 'medium' },
                { key: 'enableWithdrawals', label: 'Withdrawals', value: !!features.enableWithdrawals, description: 'Enable withdrawals processing', category: 'growth', impact: 'high' },
              ]}
              onChange={(key, value) => patch({ [key]: value })}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Pricing Model</span>
              <input type="text" value={features.pricingModelVersion || ''} onChange={(e) => setFeatures({ ...features, pricingModelVersion: e.target.value })} onBlur={() => patch({ pricingModelVersion: features.pricingModelVersion })} style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }} />
              {saving && <span style={{ opacity: 0.7 }}>Saving…</span>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminHome;
