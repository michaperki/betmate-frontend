import React from 'react';
import Header from 'components/Header';
import { useMode } from 'context/ModeContext';

const Section: React.FC<{ title: string; children: React.ReactNode } & { id?: string }> = ({ title, children, id }) => (
  <section id={id} style={{ marginTop: 16 }}>
    <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>{title}</h2>
    <div style={{ lineHeight: 1.6 }}>{children}</div>
  </section>
);

const HowBettingWorks: React.FC = () => {
  const { limits, risk } = useMode();
  const rake = typeof limits?.poolRake === 'number' ? limits?.poolRake : undefined;
  const baseMargin = typeof risk?.margins?.baseMargin === 'number' ? risk?.margins?.baseMargin : undefined;
  const drawExtra = typeof risk?.margins?.drawExtraMargin === 'number' ? risk?.margins?.drawExtraMargin : undefined;

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Header />
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '24px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>How Betting Works</h1>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20 }}>
          <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
            BetMate lets you place real‑time bets on live chess: on who will win (White/Draw/Black) and on the next move.
            There are two play modes and two currencies; here’s the quick overview of how everything fits together.
          </p>

          <Section title="Modes & Currencies" id="currencies">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><b>Arcade Mode</b> uses <b>K‑Bits</b> (“K”, “K‑BITS”) — in‑app tokens for fun play. K‑Bits themselves have no cash value.</li>
              <li><b>Real Mode</b> uses <b>BetMate Cash</b> (“$”, “Cash”) — cash‑denominated balances for real‑money style play when enabled.</li>
              <li>You may receive promos/bonuses during Beta. Promos can be adjusted or voided in cases of abuse or obvious error.</li>
            </ul>
          </Section>

          <Section title="Bet Types" id="bet-types">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><b>WDL (White / Draw / Black)</b> — <b>house‑priced</b> in Real mode. Odds include a house margin and are subject to exposure caps. A bet can be limited or rejected to control risk.</li>
              <li><b>Next‑Move Bets</b> — <b>pari‑mutuel pools</b> in Arcade (and when shown in Real move pools). Everyone bets into a pool; correct picks split the losing side after a small rake is taken.</li>
            </ul>
          </Section>

          <Section title="Rake, Margins, and Caps" id="pricing">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>
                <b>Pool Rake</b> (move pools): a small fee is taken from the pool before winners are paid.
                {typeof rake === 'number' ? (
                  <span> Current configured rake is ~{Math.round(rake * 100)}%.</span>
                ) : null}
              </li>
              <li>
                <b>House Margin</b> (WDL): the posted odds include a house edge
                {typeof baseMargin === 'number' ? ` (~${Math.round(baseMargin * 100)}% base` : ''}
                {typeof drawExtra === 'number' ? ` + ~${Math.round(drawExtra * 100)}% extra on Draw` : ''}
                {typeof baseMargin === 'number' || typeof drawExtra === 'number' ? ')' : ''}.
              </li>
              <li>
                <b>Exposure Caps</b>: we enforce per‑bet, per‑outcome, per‑game, and global limits. Bets may be partially filled, reduced, or rejected when caps are hit.
              </li>
            </ul>
          </Section>

          <Section title="Settlement (At a Glance)" id="settlement">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><b>WDL (house)</b>: Payout = stake × displayed odds. Net profit = payout − stake (if you win) or −stake (if you lose).</li>
              <li><b>Move pools (pari‑mutuel)</b>: Winners share the losing pool in proportion to their stake after rake. If no one picked the actual move, the pool can be cancelled/refunded.</li>
              <li><b>Rounding</b>: Cash to the cent. K‑Bits to whole tokens.</li>
            </ul>
          </Section>

          <Section title="Cancellations & Voids" id="voids">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Bets may be voided/refunded for obvious error, aborted games, or technical issues (e.g., missing pricing).</li>
              <li>Latency: only accepted bets (server‑acknowledged) are valid. If pricing changes during submission, a bet may be repriced or rejected.</li>
            </ul>
          </Section>

          <Section title="Withdrawals & KYC" id="withdrawals">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>When withdrawals are enabled, you can request withdrawal of eligible balances. We may require identity (KYC) per law and risk policy.</li>
              <li>Fees and network confirmation times vary by currency/provider.</li>
            </ul>
          </Section>

          <Section title="Glossary" id="glossary">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li><b>K‑Bits</b>: in‑app tokens for Arcade mode play.</li>
              <li><b>BetMate Cash</b>: cash‑denominated balance used in Real mode.</li>
              <li><b>Pari‑mutuel</b>: a pooled system where winners split losing stakes after rake.</li>
              <li><b>House</b>: BetMate as bookmaker for WDL, posting odds with a margin and controlling risk with caps.</li>
              <li><b>Rake</b>: the fee taken from a pari‑mutuel pool before distributing winnings.</li>
            </ul>
          </Section>
        </div>
      </main>
    </div>
  );
};

export default HowBettingWorks;

