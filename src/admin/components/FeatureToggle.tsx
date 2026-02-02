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
  // Get category colors
  const getCategoryColor = (cat: ToggleCategory) => {
    switch (cat) {
      case 'safety': return '#ef4444';
      case 'growth': return '#10b981';
      case 'ops': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  const getImpactBg = (imp: 'low' | 'medium' | 'high') => {
    switch (imp) {
      case 'low': return 'rgba(59,130,246,0.12)';
      case 'medium': return 'rgba(245,158,11,0.12)';
      case 'high': return 'rgba(239,68,68,0.12)';
      default: return 'rgba(59,130,246,0.12)';
    }
  };

  const categoryColor = getCategoryColor(category);
  const impactBg = getImpactBg(impact);

  return (
    <div style={{ 
      position: 'relative',
      display: 'flex', 
      alignItems: 'center', 
      gap: 8, 
      padding: '10px 12px',
      borderRadius: 8,
      background: value ? `rgba(${category === 'safety' ? '239,68,68' : category === 'growth' ? '16,185,129' : '59,130,246'},0.08)` : 'transparent',
      border: `1px solid ${value ? `rgba(${category === 'safety' ? '239,68,68' : category === 'growth' ? '16,185,129' : '59,130,246'},0.3)` : 'transparent'}`,
      transition: 'all 0.2s ease'
    }}>
      <div style={{ marginRight: 4 }}>
        <label className="switch" style={{ opacity: disabled ? 0.5 : 1 }}>
          <input 
            type="checkbox" 
            checked={value} 
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
          />
          <span className="slider round"></span>
        </label>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500 }}>{label}</span>
          {category && (
            <span style={{ 
              fontSize: 11,
              padding: '1px 6px', 
              borderRadius: 4, 
              color: categoryColor,
              border: `1px solid ${categoryColor}`,
              background: `rgba(${category === 'safety' ? '239,68,68' : category === 'growth' ? '16,185,129' : '59,130,246'},0.08)`,
            }}>
              {category}
            </span>
          )}
          {impact !== 'low' && (
            <span style={{ 
              fontSize: 11,
              padding: '1px 6px', 
              borderRadius: 4, 
              color: impact === 'high' ? '#ef4444' : '#f59e0b',
              border: `1px solid ${impact === 'high' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
              background: impactBg,
            }}>
              {impact} impact
            </span>
          )}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureToggle;