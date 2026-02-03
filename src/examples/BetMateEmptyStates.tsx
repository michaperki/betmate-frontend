import React, { useState } from 'react';

const BetMateEmptyStates: React.FC = () => {
  const [activeState, setActiveState] = useState('no-bets');

  const emptyStates = [
    { id: 'no-bets', label: 'No Active Bets' },
    { id: 'no-history', label: 'No History' },
    { id: 'no-stats', label: 'No Stats' },
    { id: 'no-markets', label: 'No Markets' },
    { id: 'no-results', label: 'No Search Results' },
    { id: 'offline', label: 'Offline' },
    { id: 'error', label: 'Error' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      fontFamily: '\'JetBrains Mono\', \'SF Mono\', monospace',
      color: '#e8e8e8',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto 40px' }}>
        <h1 style={{
          fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center',
        }}>Empty States</h1>
        <p style={{
          fontSize: 14, opacity: 0.5, textAlign: 'center', marginBottom: 24,
        }}>Click to preview different empty states</p>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
        }}>
          {emptyStates.map((state) => (
            <button
              key={state.id}
              onClick={() => setActiveState(state.id)}
              style={{
                padding: '10px 16px',
                background: activeState === state.id ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                border: activeState === state.id ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: activeState === state.id ? '#22c55e' : 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {state.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20,
          padding: '60px 40px',
          textAlign: 'center',
        }}>
          {activeState === 'no-bets' && (
            <>
              <div style={{
                width: 100,
                height: 100,
                margin: '0 auto 24px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                <span style={{ fontSize: 48 }}>🎯</span>
                <div style={{
                  position: 'absolute', inset: -4, border: '2px dashed rgba(34, 197, 94, 0.3)', borderRadius: '50%', animation: 'spin 20s linear infinite',
                }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Active Bets</h2>
              <p style={{
                fontSize: 14, opacity: 0.5, marginBottom: 32, lineHeight: 1.6,
              }}>
                You don't have any bets in play right now.<br />
                Find a game and make your first prediction!
              </p>
              <button style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                border: 'none',
                borderRadius: 12,
                color: '#000',
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>🔥</span> Browse Live Games
              </button>
            </>
          )}

          {activeState === 'no-history' && (
            <>
              <div style={{
                width: 100, height: 100, margin: '0 auto 24px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 48 }}>🧾</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Betting History</h2>
              <p style={{
                fontSize: 14, opacity: 0.5, marginBottom: 24, lineHeight: 1.6,
              }}>Once you place bets, your results will appear here.</p>
              <button style={{
                padding: '12px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              }}>View Live Games</button>
            </>
          )}

          {activeState === 'no-stats' && (
            <>
              <div style={{
                width: 100, height: 100, margin: '0 auto 24px', background: 'rgba(14, 165, 233, 0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 48 }}>📊</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Stats Yet</h2>
              <p style={{
                fontSize: 14, opacity: 0.5, marginBottom: 24, lineHeight: 1.6,
              }}>Start betting to track your performance over time.</p>
              <button style={{
                padding: '12px 24px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: 'none', borderRadius: 12, color: '#000', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              }}>Place Your First Bet</button>
            </>
          )}

          {activeState === 'no-markets' && (
            <>
              <div style={{
                width: 100, height: 100, margin: '0 auto 24px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 48 }}>♟️</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Live Games Right Now</h2>
              <p style={{
                fontSize: 14, opacity: 0.5, marginBottom: 24, lineHeight: 1.6,
              }}>There are no games available at the moment. Check back soon.</p>
              <button style={{
                padding: '12px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              }}>Notify Me</button>
            </>
          )}

          {activeState === 'no-results' && (
            <>
              <div style={{
                width: 100, height: 100, margin: '0 auto 24px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 48 }}>🔎</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Results Found</h2>
              <p style={{
                fontSize: 14, opacity: 0.5, marginBottom: 24, lineHeight: 1.6,
              }}>Try adjusting your search filters or keywords.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button style={{
                  padding: '12px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                }}>Clear Filters</button>
                <button style={{
                  padding: '12px 20px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: 'none', borderRadius: 12, color: '#000', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                }}>Search</button>
              </div>
            </>
          )}

          {activeState === 'offline' && (
            <>
              <div style={{
                width: 100, height: 100, margin: '0 auto 24px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              }}>
                <span style={{ fontSize: 48 }}>📡</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You're Offline</h2>
              <p style={{
                fontSize: 14, opacity: 0.5, marginBottom: 32, lineHeight: 1.6,
              }}>
                It looks like you've lost your internet connection.<br />
                Please check your network and try again.
              </p>
              <button style={{
                padding: '14px 28px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', border: 'none', borderRadius: 12, color: '#000', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <span>🔄</span> Try Again
              </button>
              <div style={{
                marginTop: 24, padding: '12px 16px', background: 'rgba(251, 191, 36, 0.08)', borderRadius: 8, fontSize: 12, opacity: 0.7,
              }}>⚠️ Live bets require an active connection</div>
            </>
          )}

          {activeState === 'error' && (
            <>
              <div style={{
                width: 100, height: 100, margin: '0 auto 24px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 48 }}>😵</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something Went Wrong</h2>
              <p style={{
                fontSize: 14, opacity: 0.5, marginBottom: 24, lineHeight: 1.6,
              }}>We encountered an unexpected error.<br />Our team has been notified.</p>
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontFamily: 'monospace', fontSize: 11, color: '#ef4444', textAlign: 'left',
              }}>
                Error: CONNECTION_TIMEOUT<br />
                Code: 504
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button style={{
                  padding: '14px 24px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: 'none', borderRadius: 12, color: '#000', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>🔄</span> Retry
                </button>
                <button style={{
                  padding: '14px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                }}>
                  Contact Support
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
};

export default BetMateEmptyStates;
