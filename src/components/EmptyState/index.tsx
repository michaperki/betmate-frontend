import React from 'react';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, ctaLabel, onCtaClick }) => {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: '40px 28px',
      textAlign: 'center'
    }}>
      {icon && (
        <div style={{ width: 100, height: 100, margin: '0 auto 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      )}
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {description && (
        <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 16 }}>{description}</div>
      )}
      {ctaLabel && (
        <button onClick={onCtaClick} style={{
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer'
        }}>{ctaLabel}</button>
      )}
    </div>
  );
};

export default EmptyState;

