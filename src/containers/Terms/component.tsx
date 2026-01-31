import React, { useEffect, useState } from 'react';
import Header from 'components/Header';
import { createBackendAxiosRequest } from 'store/requests';
import { getBearerTokenHeader } from 'store/actionCreators';

type TermsResponse = { accepted: number; currentVersion: number };

const TermsPage: React.FC = () => {
  const [status, setStatus] = useState<TermsResponse>({ accepted: 0, currentVersion: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await createBackendAxiosRequest<TermsResponse>({ method: 'GET', url: 'auth/terms', headers: getBearerTokenHeader() });
        setStatus(res.data);
      } catch (e: any) {
        setErr(e?.response?.data?.error || 'Failed to load terms status');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const accept = async () => {
    setSaving(true);
    setErr(null);
    try {
      const res = await createBackendAxiosRequest<TermsResponse>({ method: 'PUT', url: 'auth/terms', data: { version: status.currentVersion }, headers: getBearerTokenHeader() });
      setStatus(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to accept terms');
    } finally {
      setSaving(false);
    }
  };

  const accepted = status.accepted >= status.currentVersion;

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Header />
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '24px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>Terms & Conditions (Beta)</h1>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'grid', gap: 14, lineHeight: 1.6 }}>
                <p style={{ opacity: 0.85 }}>
                  Welcome to BetMate Beta. These light‑weight terms are meant to be simple and sane while we test with a small, invited group. By using BetMate, you agree to the following:
                </p>

                <section>
                  <h2 style={{ margin: '14px 0 6px', fontSize: 18, fontWeight: 800 }}>1) Beta Program</h2>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Access is invite‑only and functionality may change, break, or be unavailable without notice.</li>
                    <li>We may add, remove, or modify features (including pricing, limits, currencies) during the Beta.</li>
                    <li>Service is provided “as is” with no guarantees of uptime or availability.</li>
                  </ul>
                </section>

                <section>
                  <h2 style={{ margin: '14px 0 6px', fontSize: 18, fontWeight: 800 }}>2) Eligibility & Responsible Use</h2>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>You confirm you are an adult and legally permitted to participate under your local laws.</li>
                    <li>No multiple accounts, collusion, bots, or abusive behavior. We may suspend or close accounts for abuse or suspected fraud.</li>
                    <li>BetMate is for entertainment; play responsibly. Do not wager funds you cannot afford to lose.</li>
                  </ul>
                </section>

                <section>
                  <h2 style={{ margin: '14px 0 6px', fontSize: 18, fontWeight: 800 }}>3) Currencies & Balance</h2>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li><b>K‑Bits</b> (shown as “K” or “K‑BITS”) are in‑app tokens used for Arcade mode. They have no independent cash value.</li>
                    <li><b>BetMate Cash</b> (shown as “$” or “Cash”) reflects cash‑denominated balances for Real mode. In Beta, you may receive promotional credits or bonuses.</li>
                    <li>We may grant promo tokens/credits. We can void promo balances if we detect abuse or error.</li>
                  </ul>
                </section>

                <section>
                  <h2 style={{ margin: '14px 0 6px', fontSize: 18, fontWeight: 800 }}>4) Deposits, Withdrawals, and KYC</h2>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Where deposits are available, network/provider fees may apply and confirmation times vary.</li>
                    <li>Withdrawals (when enabled) may be limited to net winnings and can require identity (KYC) checks to comply with law and risk controls.</li>
                    <li>Chargebacks or payment disputes can result in balance adjustments, account holds, or closure.</li>
                  </ul>
                </section>

                <section>
                  <h2 style={{ margin: '14px 0 6px', fontSize: 18, fontWeight: 800 }}>5) Betting Rules (Summary)</h2>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Move bets (Arcade) are <b>pari‑mutuel</b>: winners split the losing pool minus a small rake. If no one is correct, affected pool bets can be cancelled/refunded.</li>
                    <li>WDL (White/Draw/Black) in Real mode is <b>house‑priced</b> with margins and exposure caps; bets may be limited or rejected for risk control.</li>
                    <li>We may void, cancel, or refund bets for obvious error, aborted games, technical issues, or integrity concerns.</li>
                    <li>Rounding: cash amounts are to the cent; K‑Bits are whole‑number tokens.</li>
                  </ul>
                </section>

                <section>
                  <h2 style={{ margin: '14px 0 6px', fontSize: 18, fontWeight: 800 }}>6) Content, Privacy, and Security</h2>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Do not post illegal, abusive, or offensive content. Respect others.</li>
                    <li>We take reasonable steps to protect your account; you are responsible for maintaining the security of your credentials.</li>
                  </ul>
                </section>

                <section>
                  <h2 style={{ margin: '14px 0 6px', fontSize: 18, fontWeight: 800 }}>7) Disclaimers & Liability</h2>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Service is provided “as is” and “as available” without warranties.</li>
                    <li>To the fullest extent permitted by law, our liability is limited to the amount you paid us in the preceding 3 months, excluding promo credits.</li>
                  </ul>
                </section>

                <section>
                  <h2 style={{ margin: '14px 0 6px', fontSize: 18, fontWeight: 800 }}>8) Changes</h2>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>We may update these Terms during Beta. Material changes may require re‑acceptance.</li>
                  </ul>
                </section>

                <p style={{ opacity: 0.7, fontSize: 13, marginTop: 8 }}>Version {status.currentVersion}</p>
                {err && <div style={{ color: 'var(--error)', marginTop: 6 }}>{err}</div>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="primary" onClick={accept} disabled={saving || accepted}>
                    {accepted ? 'Accepted' : (saving ? 'Saving…' : 'I Agree')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TermsPage;
