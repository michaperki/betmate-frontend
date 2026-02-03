import React from 'react';

type ToolbarProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: React.CSSProperties;
};

const Toolbar: React.FC<ToolbarProps> = ({ left, right, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>{left}</div>
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
  </div>
);

export default Toolbar;

