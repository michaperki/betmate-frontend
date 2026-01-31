import React from 'react';
import Header from 'components/Header';

const Item: React.FC<{ q: string; a: React.ReactNode }> = ({ q, a }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 15, fontWeight: 800 }}>{q}</div>
    <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4, lineHeight: 1.6 }}>{a}</div>
  </div>
);

const FAQ: React.FC = () => {
  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Header />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>FAQ</h1>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20 }}>
          <Item q="What’s the difference between K‑Bits and BetMate Cash?" a={
            <>
              K‑Bits are in‑app tokens used for Arcade mode. They have no independent cash value. BetMate Cash is a cash‑denominated balance used in Real mode when enabled.
            </>
          } />
          <Item q="Why was my Real‑mode bet limited or rejected?" a={
            <>
              We apply exposure caps (per‑bet, per‑outcome, per‑game, and global) and margins for risk control. If a cap is hit or pricing changes, your request can be reduced or declined. Try a smaller stake or a different outcome.
            </>
          } />
          <Item q="How are next‑move pools paid?" a={
            <>
              Move bets are pari‑mutuel: the losing side funds the winners. A small rake is taken from the pool first, then winners split the remainder in proportion to their stakes. If no one picked the actual move, the pool can be cancelled/refunded.
            </>
          } />
          <Item q="Can I withdraw?" a={
            <>
              During Beta, withdrawals may be limited and can require identity (KYC) checks. Fees and confirmation times vary. We may limit withdrawals to net winnings.
            </>
          } />
          <Item q="How do I report a bug or feedback?" a={
            <>
              Use the “Report Issue” button in the footer at any time. Thank you for helping us improve the Beta!
            </>
          } />
        </div>
      </main>
    </div>
  );
};

export default FAQ;

