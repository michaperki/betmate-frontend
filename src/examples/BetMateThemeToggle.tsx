import React, { useState } from 'react';

const BetMateThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const themes = {
    dark: {
      bg: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      cardBg: 'rgba(255,255,255,0.03)',
      cardBorder: 'rgba(255,255,255,0.08)',
      text: '#e8e8e8',
      textMuted: 'rgba(255,255,255,0.5)',
      accent: '#22c55e',
      accentBg: 'rgba(34, 197, 94, 0.15)',
      accentBorder: 'rgba(34, 197, 94, 0.3)',
      inputBg: 'rgba(255,255,255,0.05)',
      inputBorder: 'rgba(255,255,255,0.1)',
      headerBg: 'rgba(10, 10, 15, 0.8)',
      shadow: 'rgba(0,0,0,0.4)',
      win: '#22c55e',
      winBg: 'rgba(34, 197, 94, 0.1)',
      loss: '#ef4444',
      lossBg: 'rgba(239, 68, 68, 0.1)',
      white: '#e8e8e8',
      black: '#1a1a24'
    },
    light: {
      bg: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)',
      cardBg: 'rgba(255,255,255,0.8)',
      cardBorder: 'rgba(0,0,0,0.08)',
      text: '#1a1a24',
      textMuted: 'rgba(0,0,0,0.5)',
      accent: '#16a34a',
      accentBg: 'rgba(22, 163, 74, 0.1)',
      accentBorder: 'rgba(22, 163, 74, 0.3)',
      inputBg: 'rgba(0,0,0,0.03)',
      inputBorder: 'rgba(0,0,0,0.1)',
      headerBg: 'rgba(255, 255, 255, 0.9)',
      shadow: 'rgba(0,0,0,0.1)',
      win: '#16a34a',
      winBg: 'rgba(22, 163, 74, 0.1)',
      loss: '#dc2626',
      lossBg: 'rgba(220, 38, 38, 0.1)',
      white: '#ffffff',
      black: '#1a1a24'
    }
  } as const;

  const t = themes[theme];

  const stats = [
    { label: 'Balance', value: '$279.50', color: t.accent },
    { label: 'Win Rate', value: '54%', color: t.text },
    { label: 'Streak', value: '3🔥', color: t.text }
  ];

  const bets = [
    { type: 'White Win', odds: 2.25, result: 'won', profit: 6.25 },
    { type: 'Move Nc5', odds: 3.80, result: 'lost', profit: -2.00 },
    { type: 'Black Win', odds: 1.78, result: 'won', profit: 3.90 }
  ];

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: "'JetBrains Mono', 'SF Mono', monospace", color: t.text, transition: 'all 0.3s ease' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: `1px solid ${t.cardBorder}`, backdropFilter: 'blur(10px)', background: t.headerBg, position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#60a5fa' }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: t.accent, letterSpacing: 1 }}>BetMate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, opacity: 0.6 }}>Theme</span>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ width: 64, height: 32, borderRadius: 16, border: 'none', background: theme === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease', boxShadow: `0 2px 8px ${t.shadow}` }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: theme === 'dark' ? 3 : 35, transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{theme === 'dark' ? '🌙' : '☀️'}</div>
          </button>
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
        <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: 24, transition: 'all 0.3s ease', boxShadow: `0 4px 12px ${t.shadow}` }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Dashboard Preview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              {bets.map((bet, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bet.profit >= 0 ? t.winBg : t.lossBg, border: `1px solid ${bet.profit >= 0 ? t.accentBorder : t.inputBorder}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: bet.profit >= 0 ? t.accentBg : 'rgba(239, 68, 68, 0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{bet.result === 'won' ? '✓' : '✗'}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{bet.type}</div>
                      <div style={{ fontSize: 12, color: t.textMuted }}>@ {bet.odds}x</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: bet.profit >= 0 ? t.win : t.loss }}>{bet.profit >= 0 ? '+' : ''}${bet.profit.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: 24, transition: 'all 0.3s ease', boxShadow: `0 4px 12px ${t.shadow}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Form Elements</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 8 }}>Input Field</label>
                <input type="text" placeholder="Enter amount..." style={{ width: '100%', padding: '14px 16px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, color: t.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'all 0.3s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ flex: 1, padding: 14, background: `linear-gradient(135deg, ${t.accent} 0%, ${theme === 'dark' ? '#16a34a' : '#15803d'} 100%)`, border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Primary Button</button>
                <button style={{ flex: 1, padding: 14, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 12, color: t.text, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.3s ease' }}>Secondary Button</button>
              </div>
            </div>
          </div>
        </section>

        <div style={{ marginTop: 32, padding: 20, background: t.inputBg, borderRadius: 12, fontSize: 11, fontFamily: 'monospace', color: t.textMuted, transition: 'all 0.3s ease' }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: t.text }}>Current Theme: {theme.toUpperCase()}</div>
          <div>accent: {t.accent}</div>
          <div>text: {t.text}</div>
          <div>cardBg: {t.cardBg}</div>
        </div>
      </main>

      <style>{`
        input::placeholder { color: ${t.textMuted}; }
        input:focus { outline: none; border-color: ${t.accent}; }
      `}</style>
    </div>
  );
};

export default BetMateThemeToggle;

