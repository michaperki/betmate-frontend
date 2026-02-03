import React from 'react';

type ToggleCategory = 'safety' | 'growth' | 'ops';

interface FeatureToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  category?: ToggleCategory;
  impact?: 'low' | 'medium' | 'high';
  disabled?: boolean;
}

const FeatureToggle: React.FC<FeatureToggleProps> = ({
  label,
  value,
  onChange,
  description,
  category = 'ops',
  impact = 'low',
  disabled = false
}) => {
  const catColor = category === 'safety' ? '#ef4444' : category === 'growth' ? '#10b981' : '#3b82f6';
  const impactBg = impact === 'high' ? 'rgba(239,68,68,0.12)' : impact === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)';

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: value ? 'rgba(255,255,255,0.04)' : 'transparent', border: value ? '1px solid rgba(148,163,184,0.3)' : 'transparent', transition: 'all 0.2s ease' }}>
      <div style={{ marginRight: 4 }}>
        <label className="switch" style={{ opacity: disabled ? 0.5 : 1 }}>
          <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
          <span className="slider round"></span>
        </label>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500 }}>{label}</span>
          <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, color: catColor, border: `1px solid ${catColor}`, background: 'rgba(255,255,255,0.04)' }}>{category}</span>
          {impact !== 'low' && (
            <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, color: impact === 'high' ? '#ef4444' : '#f59e0b', border: `1px solid ${impact === 'high' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, background: impactBg }}>{impact} impact</span>
          )}
        </div>
        {description && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{description}</div>}
      </div>
    </div>
  );
};

export default FeatureToggle;

