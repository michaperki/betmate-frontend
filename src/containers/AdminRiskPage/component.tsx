import React, { useEffect, useMemo, useState } from 'react';
import Header from 'components/Header';
import { NavLink } from 'react-router-dom';
import {
  getGlobalExposure, getRiskConfig, updateRiskConfig, getGameExposure, resetRiskOverrides, clearAllWagers, applyRiskPreset, clearStaleWagers,
} from 'store/requests/adminRequests';
import '../../styles/admin.scss';
import { getMultiplier } from 'utils/chess';

const Field: React.FC<{ label: string; value: any; onChange: (v: any) => void; help?: string; width?: number } > = ({
  label, value, onChange, help, width = 180,
}) => (
  <label style={{ display: 'block', marginBottom: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 240, fontWeight: 600 }}>{label}</span>
      <input
        style={{
          padding: 6, width, border: '1px solid #ccc', borderRadius: 4,
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
    {help && <div style={{
      marginLeft: 248, fontSize: 12, color: '#666', marginTop: 4,
    }}>{help}</div>}
  </label>
);

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

  const Bar: React.FC<{ used: number; cap: number; label: string }> = ({ used, cap, label }) => {
    const pct = Math.max(0, Math.min(1, cap > 0 ? used / cap : 0));
    const bg = pct >= 0.9 ? '#d9534f' : pct >= 0.7 ? '#f0ad4e' : '#5cb85c';
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span>{label}</span>
          <span>${fmt(used)} / ${fmt(cap)}</span>
        </div>
        <div style={{
          height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{ width: `${pct * 100}%`, background: bg, height: 8 }} />
        </div>
      </div>
    );
  };

  // Compute severity color for cards
  const severityColor = (used: number, cap: number) => {
    const pct = cap > 0 ? used / cap : 0;
    if (pct >= 0.9) return '#d9534f'; // danger
    if (pct >= 0.7) return '#f0ad4e'; // warning
    return '#5cb85c'; // ok
  };

  return (
    <div className="dashboard-page admin-content">
      <Header />
      <div className="content" style={{ padding: 20 }}>
        <div className="admin-tabs">
          <NavLink to="/admin">Home</NavLink>
          <NavLink to="/admin/risk">Risk</NavLink>
          <NavLink to="/admin/wallet">Wallet</NavLink>
          <NavLink to="/admin/ops">Ops</NavLink>
        </div>
        <h2>Admin — Real WDL Risk</h2>
        {err && <div style={{ color: 'red', marginBottom: 12 }}>{err}</div>}
        {!cfg ? (
          <div>Loading…</div>
        ) : (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 360 }}>
              <div className="admin-card">
                <div className="admin-card__title">Global Exposure</div>
                <p style={{ fontSize: 13, marginTop: -6 }}>Worst-case across all live games versus configured caps.</p>
                {(() => {
                  const used = glob?.exposure?.total || 0;
                  const cap = glob?.caps?.globalExposureCap || 1;
                  const border = severityColor(used, cap);
                  return (
                    <div style={{
                      padding: 12, borderRadius: 6, background: '#111', border: `1px solid ${border}`, color: '#f3f4f6',
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Total worst-case</div>
                      <div style={{ fontSize: 14, marginBottom: 8 }}>${fmt(used)} / ${fmt(cap)}</div>
                      <Bar used={used} cap={cap} label="Global cap" />
                      <div style={{ marginTop: 8, fontSize: 12, color: '#444' }}>
                      Per-game cap: ${fmt(glob?.caps?.perGameWorstCaseCap)} | Per-bet cap: ${fmt(glob?.caps?.perBetLiabilityCap)}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ marginTop: 18 }}>
                  <div className="admin-card__title">Game Exposure</div>
                  <p style={{ fontSize: 13 }}>Inspect a specific game’s liabilities by outcome.</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input placeholder="Game ID (Mongo _id)" value={gameId} onChange={(e) => setGameId(e.target.value)} style={{
                      padding: 6, border: '1px solid #ccc', borderRadius: 4, width: 260,
                    }} />
                    <button onClick={async () => { try { const g = await getGameExposure(gameId); setGameExp(g.data); } catch (e) { setGameExp(null); } }} disabled={!gameId}>Load</button>
                  </div>
                  {gameExp && (() => {
                    const border = severityColor(gameExp.exposure?.worstCase || 0, gameExp.caps?.perGameWorstCaseCap || 1);
                    return (
                      <div style={{
                        marginTop: 10, border: `1px solid ${border}`, borderRadius: 6, padding: 12, background: '#111', color: '#f3f4f6',
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Game {gameExp.gameId}</div>
                        <Bar used={gameExp.exposure?.worstCase || 0} cap={gameExp.caps?.perGameWorstCaseCap || 1} label="Worst-case" />
                        <Bar used={gameExp.exposure?.perOutcome?.white_win || 0} cap={gameExp.caps?.perOutcomeCap?.white_win || 1} label="White" />
                        <Bar used={gameExp.exposure?.perOutcome?.draw || 0} cap={gameExp.caps?.perOutcomeCap?.draw || 1} label="Draw" />
                        <Bar used={gameExp.exposure?.perOutcome?.black_win || 0} cap={gameExp.caps?.perOutcomeCap?.black_win || 1} label="Black" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div style={{ minWidth: 420 }}>
              {(() => {
                return (
                  <div className="admin-card" style={{ padding: 12 }}>
                    <div className="admin-card__title">Config</div>
                    <p style={{ color: '#444', fontSize: 13, marginTop: -6 }}>Toggle availability and adjust limits/margins. Caps auto-scale from Bankroll; you can override directly if needed.</p>
                    <div style={{ marginBottom: 8 }}>
                      <label>
                        <input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Enable Real WDL House
                      </label>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label>
                        <input type="checkbox" checked={!!cfg.disableWdl} onChange={(e) => setCfg({ ...cfg, disableWdl: e.target.checked })} /> Disable WDL
                      </label>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label>
                        <input type="checkbox" checked={!!cfg.disableDraw} onChange={(e) => setCfg({ ...cfg, disableDraw: e.target.checked })} /> Disable Draw
                      </label>
                    </div>
                    <Field label="Bankroll (BetMate Cash)" value={cfg.bankroll} onChange={(v) => setCfg({ ...cfg, bankroll: v })} help="Reference bankroll for scaling caps. Increase to raise limits." />
                    <Field label="Base Margin" value={cfg.baseMargin} onChange={(v) => setCfg({ ...cfg, baseMargin: v })} help="House edge for white/black pricing (0–0.25)." />
                    <Field label="Draw Extra Margin" value={cfg.drawExtraMargin} onChange={(v) => setCfg({ ...cfg, drawExtraMargin: v })} help="Additional margin on draw (0–0.25)." />
                    <Field label="Max Odds (White)" value={cfg.maxOdds?.white_win} onChange={(v) => setCfg({ ...cfg, maxOdds: { ...cfg.maxOdds, white_win: Number(v) } })} help="Clamp for white multipliers (1x–∞)." />
                    <Field label="Max Odds (Draw)" value={cfg.maxOdds?.draw} onChange={(v) => setCfg({ ...cfg, maxOdds: { ...cfg.maxOdds, draw: Number(v) } })} help="Clamp for draw multipliers (1x–∞)." />
                    <Field label="Max Odds (Black)" value={cfg.maxOdds?.black_win} onChange={(v) => setCfg({ ...cfg, maxOdds: { ...cfg.maxOdds, black_win: Number(v) } })} help="Clamp for black multipliers (1x–∞)." />
                    <h4 style={{ marginTop: 16 }}>Absolute Caps</h4>
                    <p style={{ color: '#444', fontSize: 13, marginTop: -6 }}>Override computed caps directly (leave blank to rely on bankroll-derived defaults).</p>
                    <Field label="Global Exposure Cap (BetMate Cash)" value={cfg.globalExposureCap ?? ''} onChange={(v) => setCfg({ ...cfg, globalExposureCap: v })} help="Total worst-case across all games." />
                    <Field label="Per-Game Worst-Case Cap (BetMate Cash)" value={cfg.perGameWorstCaseCap ?? ''} onChange={(v) => setCfg({ ...cfg, perGameWorstCaseCap: v })} help="Max worst-case liability per game." />
                    <Field label="Per-Outcome Cap — White (BetMate Cash)" value={cfg?.perOutcomeCap?.white_win ?? ''} onChange={(v) => setCfg({ ...cfg, perOutcomeCap: { ...cfg.perOutcomeCap, white_win: Number(v) } })} />
                    <Field label="Per-Outcome Cap — Draw (BetMate Cash)" value={cfg?.perOutcomeCap?.draw ?? ''} onChange={(v) => setCfg({ ...cfg, perOutcomeCap: { ...cfg.perOutcomeCap, draw: Number(v) } })} />
                    <Field label="Per-Outcome Cap — Black (BetMate Cash)" value={cfg?.perOutcomeCap?.black_win ?? ''} onChange={(v) => setCfg({ ...cfg, perOutcomeCap: { ...cfg.perOutcomeCap, black_win: Number(v) } })} />
                    <Field label="Per-Bet Liability Cap (BetMate Cash)" value={cfg.perBetLiabilityCap ?? ''} onChange={(v) => setCfg({ ...cfg, perBetLiabilityCap: v })} />
                    <Field label="Per-Player Per-Game Cap (BetMate Cash)" value={cfg.perPlayerPerGameCap ?? ''} onChange={(v) => setCfg({ ...cfg, perPlayerPerGameCap: v })} />
                    <div style={{
                      display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap',
                    }}>
                      <button onClick={save} disabled={saving}>Save</button>
                      <button onClick={doReset} disabled={saving} style={{ background: '#eee' }}>Reset Overrides</button>
                      {saved && <span style={{ color: '#28a745', fontSize: 12 }}>Saved ✓</span>}
                      <span style={{ marginLeft: 12, opacity: 0.6 }}>Presets:</span>
                      <button onClick={async () => { await applyRiskPreset('low'); refresh(); }} disabled={saving}>Low</button>
                      <button onClick={async () => { await applyRiskPreset('med'); refresh(); }} disabled={saving}>Med</button>
                      <button onClick={async () => { await applyRiskPreset('high'); refresh(); }} disabled={saving}>High</button>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ minWidth: 360, flex: 1 }}>
              <div className="admin-card" style={{ padding: 12 }}>
                <div className="admin-card__title">Danger Zone</div>
                <p style={{ color: '#b94a48', fontSize: 13 }}>
                  Dev/staging only. Use with care.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    style={{
                      background: '#d9534f', color: '#fff', border: 0, borderRadius: 4, padding: '8px 12px',
                    }}
                    onClick={async () => {
                      try {
                        const res = await clearAllWagers();
                        const g2 = await getGlobalExposure();
                        setGlob(g2.data);
                        alert(`Cleared ${res.data?.deleted ?? 0} wagers.`);
                      } catch (e: any) {
                        alert('Failed to clear wagers. Check console.');
                      }
                    }}
                  >
                    Clear all wagers
                  </button>
                  <div>
                    <div style={{ marginBottom: 6 }}>Clear stale pending wagers (Real WDL):</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="number" min={5} max={1440} defaultValue={60} id="stale-wagers-mins" />
                      <button
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
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminRiskPage;
