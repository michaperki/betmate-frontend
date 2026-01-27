import React from 'react';

const BetMateLoading: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      color: '#e8e8e8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 24,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: 'radial-gradient(circle, rgb(var(--mode-accent-rgb) / 0.16) 0%, transparent 70%)', filter: 'blur(2px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--mode-accent)' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#60a5fa' }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--mode-accent)', letterSpacing: 1 }}>BetMate</span>
          </div>
          <span style={{ fontSize: 12, opacity: 0.6 }}>Loading…</span>
        </div>

        <div style={{ height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{
            width: '40%',
            height: '100%',
            background: 'linear-gradient(135deg, var(--mode-accent) 0%, var(--mode-accent-strong) 100%)',
            animation: 'bmbootmove 1200ms ease-in-out infinite alternate'
          }} />
        </div>

        <style>{`
          @keyframes bmbootmove { from { transform: translateX(-20%); } to { transform: translateX(80%); } }
        `}</style>
      </div>
    </div>
  );
};

export default BetMateLoading;
