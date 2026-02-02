import React, { useEffect, useMemo, useState } from 'react';
// Header removed; wrapped by AdminLayout. Tabs removed.
import { getGlobalExposure, getRiskConfig, updateRiskConfig, getGameExposure, resetRiskOverrides, clearAllWagers, applyRiskPreset, clearStaleWagers } from 'store/requests/adminRequests';
import '../../styles/admin.scss';
import { getMultiplier } from 'utils/chess';
import UtilizationBar from '../../admin/components/UtilizationBar';
import StatusBadge from '../../admin/components/StatusBadge';
import RiskCapField from '../../admin/components/RiskCapField';
import CriticalToggle from '../../admin/components/CriticalToggle';
import Field from '../../admin/components/Field';

const AdminRiskPage: React.FC = () => {
  const [cfg, setCfg] = useState<any | null>(null);
  const [glob, setGlob] = useState<any | null>(null);
  const [gameId, setGameId] = useState('');
  const [gameExp, setGameExp] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const refresh = async () => {
    setErr(null);
    try {
      const [c, g] = await Promise.all([getRiskConfig(), getGlobalExposure()]);
      setCfg(c.data);
      setGlob(g.data);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load admin data');
    }
  };

  useEffect(() => { refresh(); }, []);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    setErr(null);
    setSaved(false);
    try {
      const patch: any = {
        enabled: cfg.enabled,
        disableWdl: cfg.disableWdl,
        disableDraw: cfg.disableDraw,
        baseMargin: Number(cfg.baseMargin),
        drawExtraMargin: Number(cfg.drawExtraMargin),
        maxOdds: cfg.maxOdds,
        bankroll: Number(cfg.bankroll),
        // Absolute caps (optional overrides)
        globalExposureCap: Number(cfg.globalExposureCap),
        perGameWorstCaseCap: Number(cfg.perGameWorstCaseCap),
        perOutcomeCap: {
          white_win: Number(cfg?.perOutcomeCap?.white_win),
          draw: Number(cfg?.perOutcomeCap?.draw),
          black_win: Number(cfg?.perOutcomeCap?.black_win),
        },
        perBetLiabilityCap: Number(cfg.perBetLiabilityCap),
        perPlayerPerGameCap: Number(cfg.perPlayerPerGameCap),
      };
      const res = await updateRiskConfig(patch);
      setCfg(res.data);
      // Auto refresh exposure and config snapshot after save for accurate caps
      const [c2, g2] = await Promise.all([getRiskConfig(), getGlobalExposure()]);
      setCfg(c2.data);
      setGlob(g2.data);
      setSaved(true);
    } catch (e: any) {
      setErr(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const doReset = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await resetRiskOverrides();
      setCfg(res.data);
      const g2 = await getGlobalExposure();
      setGlob(g2.data);
      setSaved(true);
    } catch (e: any) {
      setErr(e?.message || 'Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (x: number | undefined) => (x == null ? '-' : x.toFixed(2));
  const badge = (x: number, cap: number) => {
    const pct = cap > 0 ? (x / cap) : 0;
    if (pct >= 0.9) return 'status-badge crit';
    if (pct >= 0.7) return 'status-badge warn';
    return 'status-badge ok';
  };

  // Compute severity color for cards
  const severityColor = (used: number, cap: number) => {
    const pct = cap > 0 ? used / cap : 0;
    if (pct >= 0.9) return '#d9534f'; // danger
    if (pct >= 0.7) return '#f0ad4e'; // warning
    return '#5cb85c'; // ok
  };

  return (
    <div className="admin-content">
      <div className="content" style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2>Risk Management Dashboard</h2>
          {err && <div style={{ color: '#ef4444', padding: '4px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 4 }}>{err}</div>}
        </div>
        
        {!cfg ? (
          <div className="admin-card" style={{ padding: 20, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '20px auto' }}></div>
            <div>Loading risk configuration...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {/* Top row - Global Exposure and Game Inspection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 16 }}>
              <div className="admin-card">
                <div className="admin-card__title">Global Exposure</div>
                <p style={{ fontSize: 13, marginTop: -6 }}>Worst-case across all live games versus configured caps.</p>
                {(() => {
                  const used = glob?.exposure?.total || 0;
                  const cap = glob?.caps?.globalExposureCap || 1;
                  const border = severityColor(used, cap);
                  return (
                    <div style={{ padding: 12, borderRadius: 6, background: '#111', border: `1px solid ${border}`, color: '#f3f4f6' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: 12 
                      }}>
                        <div style={{ fontSize: 24, fontWeight: 600 }}>${fmt(used)}</div>
                        <div>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '2px 8px', 
                            borderRadius: 12, 
                            fontSize: 12, 
                            fontWeight: 600,
                            background: border.includes('crit') ? 'rgba(239,68,68,0.15)' : 
                                      border.includes('warn') ? 'rgba(245,158,11,0.15)' : 
                                      'rgba(16,185,129,0.15)',
                            color: border.includes('crit') ? '#ef4444' : 
                                  border.includes('warn') ? '#f59e0b' : 
                                  '#10b981',
                            border: `1px solid ${border.includes('crit') ? 'rgba(239,68,68,0.3)' : 
                                          border.includes('warn') ? 'rgba(245,158,11,0.3)' : 
                                          'rgba(16,185,129,0.3)'}`
                          }}>
                            {Math.round((used / cap) * 100)}% of cap
                          </span>
                        </div>
                      </div>
                      <UtilizationBar 
                        used={used} 
                        cap={cap} 
                        label="Global Exposure Cap" 
                        showValue={false}
                        height={10}
                      />
                      <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Individual Caps</div>
                      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <UtilizationBar 
                          used={Math.max(...Object.values(glob?.exposure?.perGame || {}).map(v => Number(v) || 0), 0)} 
                          cap={glob?.caps?.perGameWorstCaseCap || 1} 
                          label="Per-game cap" 
                          height={6}
                        />
                        <UtilizationBar 
                          used={Math.max(...Object.values(glob?.exposure?.perBet || {}).map(v => Number(v) || 0), 0)} 
                          cap={glob?.caps?.perBetLiabilityCap || 1} 
                          label="Per-bet cap"
                          height={6}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="admin-card">
                <div className="admin-card__title">Game Exposure</div>
                <p style={{ fontSize: 13, marginTop: -6 }}>Inspect a specific game's liabilities by outcome.</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input placeholder="Game ID (Mongo _id)" value={gameId} onChange={e => setGameId(e.target.value)} style={{ padding: '8px 12px', background: '#191919', color: '#f3f4f6', border: '1px solid #374151', borderRadius: 4, width: 260 }} />
                  <button onClick={async () => { try { const g = await getGameExposure(gameId); setGameExp(g.data); } catch (e) { setGameExp(null); } }} disabled={!gameId} style={{ background: '#3b82f6', color: '#fff', border: 0, padding: '8px 12px', borderRadius: 4, fontWeight: 500 }}>Load</button>
                </div>
                {gameExp && (() => {
                  const border = severityColor(gameExp.exposure?.worstCase || 0, gameExp.caps?.perGameWorstCaseCap || 1);
                  return (
                    <div style={{ marginTop: 10, border: `1px solid ${border}`, borderRadius: 6, padding: 12, background: '#111', color: '#f3f4f6' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12
                      }}>
                        <div style={{ fontWeight: 700 }}>Game {gameExp.gameId}</div>
                        <div>
                          <StatusBadge status={
                            (gameExp.exposure?.worstCase / gameExp.caps?.perGameWorstCaseCap) > 0.9 ? 'crit' :
                            (gameExp.exposure?.worstCase / gameExp.caps?.perGameWorstCaseCap) > 0.7 ? 'warn' : 'ok'
                          } />
                        </div>
                      </div>

                      <UtilizationBar
                        used={gameExp.exposure?.worstCase || 0}
                        cap={gameExp.caps?.perGameWorstCaseCap || 1}
                        label="Worst-case"
                        height={8}
                        showPercentage
                      />

                      <div style={{ marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                        Exposure by Outcome
                      </div>

                      <UtilizationBar
                        used={gameExp.exposure?.perOutcome?.white_win || 0}
                        cap={gameExp.caps?.perOutcomeCap?.white_win || 1}
                        label="White"
                        height={6}
                      />
                      <UtilizationBar
                        used={gameExp.exposure?.perOutcome?.draw || 0}
                        cap={gameExp.caps?.perOutcomeCap?.draw || 1}
                        label="Draw"
                        height={6}
                      />
                      <UtilizationBar
                        used={gameExp.exposure?.perOutcome?.black_win || 0}
                        cap={gameExp.caps?.perOutcomeCap?.black_win || 1}
                        label="Black"
                        height={6}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Config row - Risk parameters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 16 }}>
              <div className="admin-card" style={{ padding: 16 }}>
                <div className="admin-card__title">Config</div>
                <p style={{ color: '#444', fontSize: 13, marginTop: -6 }}>Toggle availability and adjust limits/margins. Caps auto-scale from Bankroll; you can override directly if needed.</p>
                <div style={{ marginBottom: 16 }}>
                  <CriticalToggle
                    label="Enable Real WDL House"
                    value={!!cfg.enabled}
                    onChange={(value) => setCfg({ ...cfg, enabled: value })}
                    description="Master switch for real-money WDL betting platform-wide"
                    severity="critical"
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <CriticalToggle
                    label="Disable WDL"
                    value={!!cfg.disableWdl}
                    onChange={(value) => setCfg({ ...cfg, disableWdl: value })}
                    description="Temporarily disable all Win-Draw-Loss betting"
                    severity="critical"
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <CriticalToggle
                    label="Disable Draw"
                    value={!!cfg.disableDraw}
                    onChange={(value) => setCfg({ ...cfg, disableDraw: value })}
                    description="Hide draw outcome from available bet options"
                    severity="important"
                  />
                </div>
                <div style={{ background: 'rgba(16,185,129,0.05)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#34d399', marginBottom: 8 }}>Base Configuration</div>
                  <Field
                    label="Bankroll (USDT)"
                    value={cfg.bankroll}
                    onChange={(v) => setCfg({ ...cfg, bankroll: v })}
                    help="Reference bankroll for scaling caps. Increase to raise limits."
                  />
                  <Field
                    label="Base Margin"
                    value={cfg.baseMargin}
                    onChange={(v) => setCfg({ ...cfg, baseMargin: v })}
                    help="House edge for white/black pricing (0–0.25)."
                  />
                  <Field
                    label="Draw Extra Margin"
                    value={cfg.drawExtraMargin}
                    onChange={(v) => setCfg({ ...cfg, drawExtraMargin: v })}
                    help="Additional margin on draw (0–0.25)."
                  />
                </div>

                <div style={{ background: 'rgba(59,130,246,0.05)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa', marginBottom: 8 }}>Maximum Odds Settings</div>
                  <Field
                    label="Max Odds (White)"
                    value={cfg.maxOdds?.white_win}
                    onChange={(v) => setCfg({ ...cfg, maxOdds: { ...cfg.maxOdds, white_win: Number(v) } })}
                    help="Clamp for white multipliers (1x–∞)."
                  />
                  <Field
                    label="Max Odds (Draw)"
                    value={cfg.maxOdds?.draw}
                    onChange={(v) => setCfg({ ...cfg, maxOdds: { ...cfg.maxOdds, draw: Number(v) } })}
                    help="Clamp for draw multipliers (1x–∞)."
                  />
                  <Field
                    label="Max Odds (Black)"
                    value={cfg.maxOdds?.black_win}
                    onChange={(v) => setCfg({ ...cfg, maxOdds: { ...cfg.maxOdds, black_win: Number(v) } })}
                    help="Clamp for black multipliers (1x–∞)."
                  />
                </div>
                <h4 style={{ marginTop: 16 }}>Absolute Caps</h4>
                <p style={{ color: '#444', fontSize: 13, marginTop: -6 }}>Override computed caps directly (leave blank to rely on bankroll-derived defaults).</p>
                <RiskCapField
                  label="Global Exposure Cap (USDT)"
                  value={cfg.globalExposureCap ?? ''}
                  onChange={(v) => setCfg({ ...cfg, globalExposureCap: v })}
                  help="Total worst-case across all games."
                  currentUtilization={glob?.exposure?.total || 0}
                  maxValue={(cfg?.bankroll || 0) * 0.5}
                />
                <RiskCapField
                  label="Per-Game Worst-Case Cap (USDT)"
                  value={cfg.perGameWorstCaseCap ?? ''}
                  onChange={(v) => setCfg({ ...cfg, perGameWorstCaseCap: v })}
                  help="Max worst-case liability per game."
                  currentUtilization={Math.max(...Object.values(glob?.exposure?.perGame || {}).map(v => Number(v) || 0), 0)}
                  maxValue={(cfg?.bankroll || 0) * 0.2}
                />
                <RiskCapField
                  label="Per-Outcome Cap — White (USDT)"
                  value={cfg?.perOutcomeCap?.white_win ?? ''}
                  onChange={(v) => setCfg({ ...cfg, perOutcomeCap: { ...cfg.perOutcomeCap, white_win: Number(v) } })}
                  currentUtilization={Math.max(...Object.values(glob?.exposure?.perOutcome?.white_win || {}).map(v => Number(v) || 0), 0)}
                  maxValue={(cfg?.bankroll || 0) * 0.15}
                />
                <RiskCapField
                  label="Per-Outcome Cap — Draw (USDT)"
                  value={cfg?.perOutcomeCap?.draw ?? ''}
                  onChange={(v) => setCfg({ ...cfg, perOutcomeCap: { ...cfg.perOutcomeCap, draw: Number(v) } })}
                  currentUtilization={Math.max(...Object.values(glob?.exposure?.perOutcome?.draw || {}).map(v => Number(v) || 0), 0)}
                  maxValue={(cfg?.bankroll || 0) * 0.1}
                />
                <RiskCapField
                  label="Per-Outcome Cap — Black (USDT)"
                  value={cfg?.perOutcomeCap?.black_win ?? ''}
                  onChange={(v) => setCfg({ ...cfg, perOutcomeCap: { ...cfg.perOutcomeCap, black_win: Number(v) } })}
                  currentUtilization={Math.max(...Object.values(glob?.exposure?.perOutcome?.black_win || {}).map(v => Number(v) || 0), 0)}
                  maxValue={(cfg?.bankroll || 0) * 0.15}
                />
                <RiskCapField
                  label="Per-Bet Liability Cap (USDT)"
                  value={cfg.perBetLiabilityCap ?? ''}
                  onChange={(v) => setCfg({ ...cfg, perBetLiabilityCap: v })}
                  currentUtilization={Math.max(...Object.values(glob?.exposure?.perBet || {}).map(v => Number(v) || 0), 0)}
                  maxValue={(cfg?.bankroll || 0) * 0.05}
                />
                <RiskCapField
                  label="Per-Player Per-Game Cap (USDT)"
                  value={cfg.perPlayerPerGameCap ?? ''}
                  onChange={(v) => setCfg({ ...cfg, perPlayerPerGameCap: v })}
                  currentUtilization={Math.max(...Object.values(glob?.exposure?.perPlayer || {}).map(v => Number(v) || 0), 0)}
                  maxValue={(cfg?.bankroll || 0) * 0.025}
                />
                <div style={{ marginTop: 20, padding: 16, background: 'rgba(31,41,55,0.5)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <button 
                        onClick={save} 
                        disabled={saving} 
                        style={{ 
                          background: '#3b82f6', 
                          color: '#fff', 
                          border: 0, 
                          padding: '8px 16px', 
                          borderRadius: 6, 
                          fontWeight: 600,
                          marginRight: 8
                        }}
                      >
                        Save Configuration
                      </button>
                      <button 
                        onClick={doReset} 
                        disabled={saving} 
                        style={{ 
                          background: 'transparent', 
                          color: '#94a3b8', 
                          border: '1px solid #374151',
                          padding: '8px 16px', 
                          borderRadius: 6 
                        }}
                      >
                        Reset Overrides
                      </button>
                      {saved && <span style={{ color: '#10b981', fontSize: 13, marginLeft: 8 }}>✓ Saved</span>}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>Quick presets:</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button 
                        className="preset-btn beta" 
                        onClick={async () => { 
                          if (window.confirm("Beta preset has minimal margins and very low caps. Only use for testing.")) {
                            await applyRiskPreset('low'); 
                            // Additional bankroll adjustment for beta
                            setCfg(prev => ({ ...prev, bankroll: Math.max(50, prev.bankroll * 0.1) }));
                            save(); 
                            refresh(); 
                          }
                        }} 
                        disabled={saving}
                      >
                        Beta
                      </button>
                      <button 
                        className="preset-btn low" 
                        onClick={async () => { await applyRiskPreset('low'); refresh(); }} 
                        disabled={saving}
                      >
                        Low Risk
                      </button>
                      <button 
                        className="preset-btn med" 
                        onClick={async () => { await applyRiskPreset('med'); refresh(); }} 
                        disabled={saving}
                      >
                        Medium Risk
                      </button>
                      <button 
                        className="preset-btn high" 
                        onClick={async () => { await applyRiskPreset('high'); refresh(); }} 
                        disabled={saving}
                      >
                        High Risk
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ marginTop: 16 }}>
              <div className="admin-card__title">
                <span>Danger Zone</span>
                <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>DEV ONLY</span>
              </div>
              <p style={{ color: '#ef4444', fontSize: 13, opacity: 0.8 }}>
                These operations are destructive and only for development/staging environments. Use with extreme caution.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
                <div className="danger-action" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#f87171' }}>Clear All Wagers</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Removes all wagers from the database. This cannot be undone.</div>
                  <button
                    style={{ 
                      background: 'rgba(239,68,68,0.9)', 
                      color: '#fff', 
                      border: 0, 
                      borderRadius: 4, 
                      padding: '8px 12px', 
                      width: '100%',
                      fontWeight: 500
                    }}
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete ALL wagers? This action cannot be undone.')) {
                        try {
                          const res = await clearAllWagers();
                          const g2 = await getGlobalExposure();
                          setGlob(g2.data);
                          alert(`Cleared ${res.data?.deleted ?? 0} wagers.`);
                        } catch (e: any) {
                          alert('Failed to clear wagers. Check console.');
                        }
                      }
                    }}
                  >
                    Clear all wagers
                  </button>
                </div>
                
                <div className="danger-action" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#f59e0b' }}>Clear Stale Wagers</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                    Removes pending wagers older than the specified number of minutes. Useful for cleanup.
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input 
                      type="number" 
                      min={5} 
                      max={1440} 
                      defaultValue={60} 
                      id="stale-wagers-mins"
                      style={{ 
                        flex: 1, 
                        padding: '8px 12px', 
                        background: '#191919', 
                        color: '#f3f4f6', 
                        border: '1px solid #374151', 
                        borderRadius: 4 
                      }}
                    />
                    <button
                      style={{ 
                        background: 'rgba(245,158,11,0.9)', 
                        color: '#fff', 
                        border: 0, 
                        borderRadius: 4, 
                        padding: '8px 12px',
                        fontWeight: 500
                      }}
                      onClick={async () => {
                        const mins = Number((document.getElementById('stale-wagers-mins') as HTMLInputElement).value || '60');
                        try {
                          const res = await clearStaleWagers(mins);
                          const g2 = await getGlobalExposure();
                          setGlob(g2.data);
                          alert(`Cancelled ${res.updated} stale wagers older than ${res.olderThanMinutes} minutes.`);
                        } catch (e) { alert('Failed to clear stale wagers.'); }
                      }}
                    >
                      Clear stale
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRiskPage;