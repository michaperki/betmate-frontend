import React, { useEffect, useMemo, useState } from 'react';
import { getAdminFeatures, updateAdminFeatures, getAdminHome, getAdminPaymentVolumeDaily } from 'store/requests/adminRequests';
import Card from '../../admin/components/Card';
import Sparkline from '../../admin/components/Sparkline';
import StatusBadge, { DeltaBadge, TrendIcon } from '../../admin/components/StatusBadge';
import KPICard from '../../admin/components/KPICard';
import FeatureToggle from '../../admin/components/FeatureToggle';
import FeatureSection from '../../admin/components/FeatureSection';
import '../../styles/admin.scss';

const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }>= ({ label, value, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
    <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    <span>{label}</span>
  </label>
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
  const [daily, setDaily] = useState<{ deposits: Array<{ date: string; count: number }>; withdrawals: Array<{ date: string; count: number }> } | null>(null);
  // Email test panel removed

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

  const depValues = useMemo(() => (daily?.deposits || []).map(d => d.count), [daily]);
  const wdlValues = useMemo(() => (daily?.withdrawals || []).map(d => d.count), [daily]);

  const deposits24h = useMemo(() => home?.payments?.confirmed24h ?? (depValues.length ? depValues[depValues.length - 1] : 0), [home, depValues]);
  const withdrawals24h = useMemo(() => (wdlValues.length ? wdlValues[wdlValues.length - 1] : 0), [wdlValues]);
  const bankroll = home?.risk?.bankroll || 0;
  const globalExposure = home?.risk?.globalExposure || 0;
  const exposureCap = Math.max(1, bankroll * 0.5);
  const exposurePct = Math.min(100, Math.round((globalExposure / exposureCap) * 100));

  // Calculate trends and deltas
  const calcDelta = (values: number[]) => {
    if (!values || values.length < 2) return 0;
    const current = values[values.length - 1] || 0;
    const previous = values[values.length - 2] || 0;
    return current - previous;
  };

  const calcTrend = (values: number[], days = 7) => {
    if (!values || values.length < days) return 0;
    const recent = values.slice(-days);
    let sum = 0;
    for (let i = 1; i < recent.length; i++) {
      sum += recent[i] - recent[i-1];
    }
    return sum / (recent.length - 1);
  };

  const depositsDelta = useMemo(() => calcDelta(depValues), [depValues]);
  const withdrawalsDelta = useMemo(() => calcDelta(wdlValues), [wdlValues]);
  const depositsTrend = useMemo(() => calcTrend(depValues), [depValues]);
  const withdrawalsTrend = useMemo(() => calcTrend(wdlValues), [wdlValues]);

  return (
    <div className="admin-content">
      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPICard
          title="Bankroll"
          value={`$${(bankroll || 0).toLocaleString()}`}
          subtitle="Available funds"
          icon="$"
          iconColor="#34d399"
          iconBg="rgba(16,185,129,0.12)"
          badge="Bank"
        />

        <KPICard
          title="Global Exposure"
          value={`$${globalExposure.toLocaleString()}`}
          subtitle="Global Exposure"
          icon="!"
          iconColor="#f59e0b"
          iconBg="rgba(245,158,11,0.12)"
          badge={`${exposurePct}%`}
          progress={exposurePct}
        />

        <KPICard
          title="Deposits"
          value={deposits24h}
          subtitle="Deposits (24h)"
          icon="↓"
          iconColor="#60a5fa"
          iconBg="rgba(59,130,246,0.12)"
          badge="24h"
          delta={depositsDelta}
          trend={depositsTrend}
          sparkValues={depValues}
          prefix="$"
        />

        <KPICard
          title="Withdrawals"
          value={withdrawals24h}
          subtitle="Withdrawals (24h)"
          icon="↑"
          iconColor="#a78bfa"
          iconBg="rgba(139,92,246,0.12)"
          badge="24h"
          delta={withdrawalsDelta}
          trend={withdrawalsTrend}
          sparkValues={wdlValues}
          sparkColor="#8b5cf6"
          sparkFill="rgba(139,92,246,0.15)"
          prefix="$"
        />
      </div>

      {/* Feature flags + Environment */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="admin-card">
          <div className="admin-card__title"><span>Feature Flags</span><a href="/admin" style={{ fontSize: 12, color: '#94a3b8' }}>View All</a></div>

          {/* Safety Features */}
          <FeatureSection
            title="Safety Features"
            category="safety"
            features={[
              {
                key: 'requireKyc',
                label: 'Require KYC',
                value: !!features.requireKyc,
                description: 'Restrict real-money operations to KYC verified users only',
                category: 'safety',
                impact: 'high'
              },
              {
                key: 'requireEmailVerification',
                label: 'Require Email Verification',
                value: !!features.requireEmailVerification,
                description: 'Enforce email verification before allowing operations',
                category: 'safety',
                impact: 'medium'
              },
              {
                key: 'enableRateLimiting',
                label: 'Rate Limiting',
                value: !!features.enableRateLimiting,
                description: 'Prevent API abuse by limiting request frequency',
                category: 'safety',
                impact: 'medium'
              }
            ]}
            onChange={(key, value) => patch({ [key]: value })}
          />

          {/* Growth Features */}
          <FeatureSection
            title="Growth Features"
            category="growth"
            features={[
              {
                key: 'realModeEnabled',
                label: 'Real Mode',
                value: !!features.realModeEnabled,
                description: 'Enable real-money operations platform-wide',
                category: 'growth',
                impact: 'high'
              },
              {
                key: 'enableFaucet',
                label: 'Faucet',
                value: !!features.enableFaucet,
                description: 'Allow users to get free test funds',
                category: 'growth',
                impact: 'low'
              }
            ]}
            onChange={(key, value) => patch({ [key]: value })}
          />

          {/* Operations Features */}
          <FeatureSection
            title="Operations"
            category="ops"
            features={[
              {
                key: 'enableWithdrawals',
                label: 'Withdrawals',
                value: !!features.enableWithdrawals,
                description: 'Allow users to withdraw funds',
                category: 'ops',
                impact: 'high'
              },
              {
                key: 'pauseGameIntake',
                label: 'Pause Game Intake',
                value: !!features.pauseGameIntake,
                description: 'Temporarily stop new Lichess games from starting (current games continue)',
                category: 'ops',
                impact: 'high'
              }
            ]}
            onChange={(key, value) => patch({ [key]: value })}
          />

          <div style={{ marginTop: 16 }}>
            <div className={`feature-group-heading ops`}>System Configuration</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
              <span>Pricing Model Version</span>
              <input
                value={features.pricingModelVersion || ''}
                onChange={(e) => setFeatures({ ...features, pricingModelVersion: e.target.value })}
                onBlur={() => patch({ pricingModelVersion: features.pricingModelVersion })}
                style={{ background: '#191919', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
              <span>Pause Message</span>
              <input
                value={features.pauseMessage || ''}
                onChange={(e) => setFeatures({ ...features, pauseMessage: e.target.value })}
                onBlur={() => patch({ pauseMessage: features.pauseMessage })}
                placeholder="Show this message to users when paused"
                style={{ background: '#191919', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '6px 8px', width: '100%' }}
              />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__title"><span>System Status</span></div>
          {home?.env && (
            <div>
              <div style={{ marginBottom: 12, padding: 12, borderRadius: 6, background: '#111', border: '1px solid #2a2a2a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Environment</span>
                  <StatusBadge status={home.env.nodeEnv === 'production' ? 'crit' : 'warn'} />
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {home.env.nodeEnv === 'production'
                    ? 'Production environment - changes affect real users'
                    : 'Development environment - safe for testing'}
                </div>
              </div>

              <div style={{ marginBottom: 12, padding: 12, borderRadius: 6, background: '#111', border: '1px solid #2a2a2a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Application Version</span>
                  <span style={{ fontSize: 12, padding: '2px 6px', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', borderRadius: 4 }}>{home.env.version}</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>
                  Release: {home.env.release || 'No release tag'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Commit: {home.env.commit?.slice(0, 7) || 'Unknown'}
                </div>
              </div>

              <div style={{ marginBottom: 12, padding: 12, borderRadius: 6, background: '#111', border: '1px solid #2a2a2a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Services</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>Payment Provider</span>
                    <StatusBadge status={home.env.provider ? 'ok' : 'warn'} />
                  </div>
                  {home?.env?.email && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span>Email Service</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{home.env.email.provider}</span>
                        <StatusBadge status="ok" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="admin-card">
          <div className="admin-card__title"><span>Deposits (7d)</span><a href="/admin/wallet" style={{ fontSize: 12, color: '#94a3b8' }}>Open</a></div>
          <Sparkline values={depValues} />
        </div>
        <div className="admin-card">
          <div className="admin-card__title"><span>Withdrawals (7d)</span><a href="/admin/wallet" style={{ fontSize: 12, color: '#94a3b8' }}>Open</a></div>
          <Sparkline values={wdlValues} stroke="#8b5cf6" fill="rgba(139,92,246,0.15)" />
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
