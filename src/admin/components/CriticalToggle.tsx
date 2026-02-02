import React from 'react';

interface CriticalToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  severity?: 'critical' | 'important' | 'normal';
  disabled?: boolean;
  showConfirmation?: boolean;
}

const CriticalToggle: React.FC<CriticalToggleProps> = ({
  label,
  value,
  onChange,
  description,
  severity = 'normal',
  disabled = false,
  showConfirmation = true
}) => {
  // Handle toggle with optional confirmation
  const handleChange = (newValue: boolean) => {
    if (showConfirmation && severity === 'critical' && newValue !== value) {
      const action = newValue ? 'enable' : 'disable';
      if (window.confirm(`Are you sure you want to ${action} ${label}? This is a CRITICAL system setting.`)) {
        onChange(newValue);
      }
    } else {
      onChange(newValue);
    }
  };
  
  // Get styles based on severity
  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return {
          container: {
            border: '1px solid #ef4444',
            background: 'rgba(239,68,68,0.08)'
          },
          badge: {
            color: '#ef4444',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)'
          }
        };
      case 'important':
        return {
          container: {
            border: '1px solid #f59e0b',
            background: 'rgba(245,158,11,0.08)'
          },
          badge: {
            color: '#f59e0b',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)'
          }
        };
      default:
        return {
          container: {
            border: '1px solid transparent'
          },
          badge: {
            color: '#94a3b8',
            background: 'rgba(148,163,184,0.1)',
            border: '1px solid rgba(148,163,184,0.3)'
          }
        };
    }
  };
  
  const styles = getSeverityStyles();
  
  return (
    <div style={{ 
      position: 'relative',
      display: 'flex', 
      alignItems: 'center', 
      gap: 8, 
      padding: '12px 16px',
      borderRadius: 8,
      ...styles.container,
      transition: 'all 0.2s ease'
    }}>
      <div style={{ marginRight: 4 }}>
        <label className={`switch ${severity === 'critical' ? 'critical' : ''}`} style={{ opacity: disabled ? 0.5 : 1 }}>
          <input 
            type="checkbox" 
            checked={value} 
            onChange={(e) => handleChange(e.target.checked)}
            disabled={disabled}
          />
          <span className="slider round"></span>
        </label>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: severity === 'normal' ? 400 : 600 }}>{label}</span>
          {severity !== 'normal' && (
            <span style={{ 
              fontSize: 11,
              padding: '1px 6px', 
              borderRadius: 4, 
              ...styles.badge
            }}>
              {severity}
            </span>
          )}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      
      {/* Warning icon for critical controls */}
      {severity === 'critical' && (
        <div style={{
          marginLeft: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          color: '#ef4444',
          fontSize: 14,
          fontWeight: 'bold'
        }}>
          !
        </div>
      )}
    </div>
  );
};

export default CriticalToggle;