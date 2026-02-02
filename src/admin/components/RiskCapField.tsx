import React from 'react';
import UtilizationBar from './UtilizationBar';

interface RiskCapFieldProps {
  label: string;
  value: string | number;
  onChange: (value: any) => void;
  currentUtilization?: number;
  maxValue?: number;
  help?: string;
  width?: number;
  prefix?: string;
}

const RiskCapField: React.FC<RiskCapFieldProps> = ({
  label,
  value,
  onChange,
  currentUtilization = 0,
  maxValue,
  help,
  width = 180,
  prefix = '$'
}) => {
  // Calculate utilization vs cap
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const cap = isNaN(numericValue) ? (maxValue || 0) : numericValue;
  
  // Determine input border color based on utilization
  const getBorderColor = (utilized: number, cap: number) => {
    if (cap === 0) return '#374151'; // default border
    const pct = utilized / cap;
    if (pct >= 0.9) return '#ef4444'; // danger red
    if (pct >= 0.7) return '#f59e0b'; // warning amber
    return '#374151'; // default
  };
  
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ 
          display: 'inline-block', 
          width: 240, 
          fontWeight: 600,
          fontSize: 13,
          opacity: currentUtilization > 0 ? 1 : 0.8
        }}>
          {label}
        </span>
        
        <div>
          <input
            style={{
              padding: '6px 10px',
              width,
              background: '#191919',
              color: '#f3f4f6',
              border: `1px solid ${getBorderColor(currentUtilization, cap)}`,
              borderRadius: 4,
              outline: 'none',
              fontSize: 14,
              boxShadow: currentUtilization / cap > 0.9 ? '0 0 0 1px #ef4444' : 'none'
            }}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={maxValue ? maxValue.toString() : ''}
          />
        </div>
      </div>
      
      {help && (
        <div style={{ marginLeft: 248, fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
          {help}
        </div>
      )}
      
      {currentUtilization > 0 && (
        <div style={{ marginLeft: 248, marginTop: 4 }}>
          <UtilizationBar 
            used={currentUtilization}
            cap={cap || (maxValue || 1)}
            label="Current utilization"
            prefix={prefix}
            showPercentage={true}
            height={6}
            width="100%"
          />
        </div>
      )}
    </label>
  );
};

export default RiskCapField;