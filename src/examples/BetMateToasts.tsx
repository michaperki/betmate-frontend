import React, { useEffect, useState } from 'react';

type ToastType = 'success' | 'win' | 'loss' | 'error' | 'info';

const BetMateToasts: React.FC = () => {
  const [toasts, setToasts] = useState<Array<any>>([]);
  const [toastId, setToastId] = useState(0);

  const toastTypes = [
    {
      id: 'bet-placed', type: 'success' as ToastType, icon: '✓', title: 'Bet Placed', message: '$5.00 on Black Win @ 2.10x', action: 'View Bet',
    },
    {
      id: 'bet-won', type: 'win' as ToastType, icon: '🎉', title: 'You Won!', message: '+$10.50 on White Win', action: 'Collect',
    },
    {
      id: 'bet-lost', type: 'loss' as ToastType, icon: '😔', title: 'Bet Lost', message: '-$5.00 on Move Nc5', action: 'Try Again',
    },
    {
      id: 'deposit', type: 'success' as ToastType, icon: '💰', title: 'Deposit Confirmed', message: '+$100.00 added to your balance', action: 'Start Betting',
    },
    {
      id: 'withdraw', type: 'info' as ToastType, icon: '📤', title: 'Withdrawal Processing', message: '$50.00 will arrive in ~10 minutes', action: 'Track',
    },
    {
      id: 'game-starting', type: 'info' as ToastType, icon: '🔔', title: 'Game Starting Soon', message: 'Carlsen vs Nakamura in 5 minutes', action: 'Join',
    },
    {
      id: 'cashout', type: 'success' as ToastType, icon: '💵', title: 'Cash Out Successful', message: 'Secured $8.50 profit', action: 'View',
    },
    {
      id: 'error', type: 'error' as ToastType, icon: '⚠️', title: 'Transaction Failed', message: 'Please check your connection and try again', action: 'Retry',
    },
  ];

  const addToast = (toastType: any) => {
    const newToast = { ...toastType, uniqueId: toastId };
    setToastId((prev) => prev + 1);
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => { removeToast(newToast.uniqueId); }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.uniqueId !== id));
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)', border: '1px solid rgba(34, 197, 94, 0.3)', iconBg: 'rgba(34, 197, 94, 0.2)', iconColor: '#22c55e',
        };
      case 'win':
        return {
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)', border: '1px solid rgba(34, 197, 94, 0.4)', iconBg: 'linear-gradient(135deg, #22c55e 0%, #fbbf24 100%)', iconColor: '#000',
        };
      case 'loss':
        return {
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.04) 100%)', border: '1px solid rgba(239, 68, 68, 0.25)', iconBg: 'rgba(239, 68, 68, 0.2)', iconColor: '#ef4444',
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)', iconBg: 'rgba(239, 68, 68, 0.2)', iconColor: '#ef4444',
        };
      case 'info':
      default:
        return {
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.04) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)', iconBg: 'rgba(99, 102, 241, 0.2)', iconColor: '#818cf8',
        };
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setToasts([]); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)', fontFamily: '\'JetBrains Mono\', \'SF Mono\', monospace', color: '#e8e8e8', padding: 24,
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Toast Examples</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {toastTypes.map((t) => (
            <button key={t.id} onClick={() => addToast(t)} style={{
              padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            }}>{t.title}</button>
          ))}
          <button onClick={() => setToasts([])} style={{
            padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          }}>Clear All</button>
        </div>
      </header>

      <div style={{
        position: 'fixed', top: 16, right: 16, display: 'grid', gap: 10, width: 360, maxWidth: 'calc(100vw - 32px)', zIndex: 1000,
      }}>
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div key={toast.uniqueId} style={{
              ...styles as any, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, padding: 12, borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.4)', animation: 'slideIn 220ms ease',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: (styles as any).iconBg, color: (styles as any).iconColor, fontSize: 16,
              }}>{toast.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{toast.title}</div>
                {toast.message && <div style={{ fontSize: 12, opacity: 0.7 }}>{toast.message}</div>}
                <div style={{
                  position: 'relative', height: 2, marginTop: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.2)', animation: 'progress 5s linear forwards',
                  }} />
                </div>
              </div>
              <div style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
                {toast.action && <button style={{
                  background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                }}>{toast.action}</button>}
                <button onClick={() => removeToast(toast.uniqueId)} style={{
                  background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12,
                }}>Dismiss</button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        maxWidth: 380, margin: '60px auto 0', padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h3 style={{
          fontSize: 14, fontWeight: 600, marginBottom: 16, opacity: 0.6,
        }}>Mobile Preview (Bottom Position)</h3>
        <div style={{
          background: '#0a0a0f', borderRadius: 12, padding: 16, minHeight: 200, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 12, width: '60%',
          }} />
          <div style={{
            height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 4, marginBottom: 8,
          }} />
          <div style={{
            height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 4, width: '80%',
          }} />
          <div style={{
            position: 'absolute', bottom: 16, left: 16, right: 16, background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, background: 'linear-gradient(135deg, #22c55e 0%, #fbbf24 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>🎉</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>You Won!</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>+$10.50</div>
            </div>
            <button style={{
              background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 10, fontWeight: 600, fontFamily: 'inherit',
            }}>Collect</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default BetMateToasts;
