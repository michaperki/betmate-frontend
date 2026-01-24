import React, { useState, useEffect } from 'react';

// Converted from MOCKUP.md — preserved inline styles for fidelity
const NewGame: React.FC = () => {
  const [gameState, setGameState] = useState<'live' | 'ending' | 'ended'>('live');
  const [showSummary, setShowSummary] = useState(false);
  const [betsResolved, setBetsResolved] = useState(false);

  const simulateGameEnd = () => {
    setGameState('ending');
    setTimeout(() => {
      setGameState('ended');
      setTimeout(() => setBetsResolved(true), 600);
      setTimeout(() => setShowSummary(true), 1800);
    }, 500);
  };

  const resetDemo = () => {
    setGameState('live');
    setShowSummary(false);
    setBetsResolved(false);
  };

  const bets = [
    { type: 'black_win', stake: 2, odds: 2.02, won: true },
    { type: 'white_win', stake: 2, odds: 1.96, won: false },
    { type: 'Nd2', stake: 2, odds: 1.90, won: true },
  ];

  const totalWon = bets.filter(b => (b as any).won).reduce((sum, b) => sum + (b.stake * (b.odds as number)), 0);
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const netProfit = totalWon - totalStaked;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
      fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
      color: '#e8e8e8',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '30%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(60px)'
      }} />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '0 8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#22c55e', letterSpacing: '1px' }}>BetMate</span>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ opacity: 0.6 }}>Balance:</span>
          <span style={{ color: '#22c55e', fontWeight: '600' }}>279 USDT</span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 280px',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5, marginBottom: '4px' }}>Move Predictions</div>
          {['Nc5', 'N4c3', 'N2c3', 'Nd2'].map((move, i) => (
            <div key={move} style={{
              background: gameState === 'ended' ? 'rgba(255,255,255,0.02)' : 'rgba(34, 197, 94, 0.08)',
              border: `1px solid ${gameState === 'ended' ? 'rgba(255,255,255,0.05)' : 'rgba(34, 197, 94, 0.2)'}`,
              borderRadius: '12px',
              padding: '16px',
              transition: 'all 0.5s ease',
              opacity: gameState === 'ended' ? 0.4 : 1
            }}>
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>{move}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.7 }}>
                <span>{[100, 92, 84, 76][i]}</span>
                <span>x{[3.80, 1.90, 1.90, 1.90][i]}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', background: '#1a1a24', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>♚</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Mahlermaniaco</div>
                <div style={{ fontSize: '11px', opacity: 0.5 }}>2563</div>
              </div>
            </div>
            <div style={{
              background: gameState === 'ended' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              fontVariantNumeric: 'tabular-nums',
              color: gameState === 'ended' ? '#ef4444' : '#fff'
            }}>
              {gameState === 'ended' ? '0:00' : '08:19'}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              aspectRatio: '1',
              background: 'linear-gradient(135deg, #2a2a3a 0%, #1e1e28 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              overflow: 'hidden',
              transition: 'all 0.5s ease',
              filter: gameState === 'ended' ? 'brightness(0.6)' : 'brightness(1)'
            }}>
              {Array(64).fill(0).map((_, i) => {
                const row = Math.floor(i / 8);
                const col = i % 8;
                const isLight = (row + col) % 2 === 0;
                return (
                  <div key={i} style={{
                    background: isLight ? '#b8c0a8' : '#6b8a5c',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px'
                  }}>
                    {i === 3 && '♛'}
                    {i === 4 && '♚'}
                    {i === 0 && '♜'}
                    {i === 7 && '♚'}
                    {i === 56 && '♖'}
                    {i === 59 && '♕'}
                    {i === 63 && '♖'}
                  </div>
                );
              })}
            </div>

            {gameState !== 'live' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.7)',
                borderRadius: '12px',
                backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.4s ease',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '3px', opacity: 0.6 }}>Game Over</div>
                <div style={{ fontSize: '28px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '36px' }}>♚</span>
                  Black Wins
                </div>
                <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '-8px' }}>by resignation</div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={resetDemo}
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      color: '#22c55e',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e: any) => e.target.style.background = 'rgba(34, 197, 94, 0.25)'}
                    onMouseOut={(e: any) => e.target.style.background = 'rgba(34, 197, 94, 0.15)'}
                  >
                    Watch Next Game
                  </button>
                  <button style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    fontFamily: 'inherit',
                    opacity: 0.8
                  }}>
                    Review Game
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            padding: '12px 16px',
            background: gameState === 'ended' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            border: `1px solid ${gameState === 'ended' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.06)'}`,
            transition: 'all 0.5s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', background: '#e8e8e8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#1a1a24' }}>♔</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  dudalodudalo
                  {gameState === 'ended' && (
                    <span style={{
                      background: '#22c55e',
                      color: '#000',
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: '700'
                    }}>WINNER</span>
                  )}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.5 }}>2466</div>
              </div>
            </div>
            <div style={{ background: 'rgba(34, 197, 94, 0.2)', padding: '6px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>07:27</div>
          </div>

          {gameState === 'live' && (
            <button
              onClick={simulateGameEnd}
              style={{
                marginTop: '20px',
                width: '100%',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                border: 'none',
                color: '#000',
                padding: '14px 24px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: 'inherit',
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)'
              }}
              onMouseOver={(e: any) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e: any) => e.target.style.transform = 'translateY(0)'}
            >
              ▶ Simulate Game End
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5, marginBottom: '12px' }}>Your Bets</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
              {bets.map((bet: any, i: number) => (
                <div key={i} style={{
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: i < bets.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  transition: 'all 0.5s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: bet.type === 'black_win' ? '#1a1a24' : bet.type === 'white_win' ? '#e8e8e8' : '#6366f1', border: bet.type === 'black_win' ? '1px solid #444' : 'none', transition: 'all 0.3s ease' }} />
                    <span style={{ fontSize: '13px', opacity: betsResolved && !bet.won ? 0.4 : 1, textDecoration: betsResolved && !bet.won ? 'line-through' : 'none', transition: 'all 0.5s ease' }}>
                      {bet.type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>${bet.stake}</span>
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>x{bet.odds}</span>
                    <div style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', minWidth: '60px', textAlign: 'center', transition: 'all 0.4s ease', transitionDelay: `${i * 0.15}s`, background: betsResolved ? (bet.won ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)') : 'rgba(251, 191, 36, 0.15)', color: betsResolved ? (bet.won ? '#22c55e' : '#ef4444') : '#fbbf24' }}>
                      {betsResolved 
                        ? (bet.won ? `+$${(bet.stake * bet.odds - bet.stake).toFixed(2)}` : '-$' + bet.stake.toFixed(2))
                        : 'Pending'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showSummary && (
            <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.04) 100%)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '12px', padding: '20px', animation: 'slideUp 0.4s ease' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6, marginBottom: '16px' }}>Game Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.7, fontSize: '13px' }}>Total Staked</span>
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>${totalStaked.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.7, fontSize: '13px' }}>Total Won</span>
                  <span style={{ fontWeight: '600', fontSize: '13px', color: '#22c55e' }}>${totalWon.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>Net Profit</span>
                  <span style={{ fontWeight: '700', fontSize: '18px', color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                    {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ fontSize: '16px' }}>🔥</span>
                <span style={{ opacity: 0.8 }}>3 game win streak!</span>
              </div>
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5, marginBottom: '12px' }}>Position Eval</div>
            <div style={{ height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex', background: '#1a1a24' }}>
              <div style={{ width: gameState === 'ended' ? '100%' : '48%', background: '#1a1a24', transition: 'width 1s ease' }} />
              <div style={{ width: gameState === 'ended' ? '0%' : '3%', background: '#6b7280', transition: 'width 1s ease' }} />
              <div style={{ width: gameState === 'ended' ? '0%' : '49%', background: '#e8e8e8', transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', opacity: 0.6 }}>
              <span>Black {gameState === 'ended' ? '100%' : '48%'}</span>
              <span>White {gameState === 'ended' ? '0%' : '49%'}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default NewGame;

