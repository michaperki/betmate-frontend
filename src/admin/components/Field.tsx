import React from 'react';

interface FieldProps {
  label: string;
  value: any; 
  onChange: (value: any) => void;
  help?: string;
  width?: number;
  type?: string;
}

const Field: React.FC<FieldProps> = ({ 
  label, 
  value, 
  onChange, 
  help, 
  width = 180,
  type = 'text'
}) => (
  <label style={{ display: 'block', marginBottom: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 240, fontWeight: 600 }}>{label}</span>
      <input
        style={{ 
          padding: '6px 10px', 
          width, 
          background: '#191919',
          color: '#f3f4f6',
          border: '1px solid #374151',
          borderRadius: 4,
          fontSize: 14
        }}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
    {help && <div style={{ marginLeft: 248, fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{help}</div>}
  </label>
);

export default Field;