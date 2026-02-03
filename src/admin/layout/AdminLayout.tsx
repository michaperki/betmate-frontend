import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../../styles/admin.scss';

type AdminLayoutProps = { title?: string };

type NavGroup = { title?: string; items: Array<{ label: string; to: string }> };
const navGroups: NavGroup[] = [
  { items: [ { label: 'Home', to: '/admin' } ] },
  { title: 'Risk', items: [ { label: 'Risk Management', to: '/admin/risk' } ] },
  { title: 'Wallet', items: [ { label: 'Deposits/Withdrawals', to: '/admin/wallet' } ] },
  { title: 'Users', items: [ { label: 'Search', to: '/admin/users/search' }, { label: 'Ledger', to: '/admin/users/ledger' }, { label: 'KYC', to: '/admin/kyc' } ] },
  { title: 'Ops', items: [ { label: 'Operational Health', to: '/admin/ops' } ] },
  { title: 'Promotions', items: [ { label: 'Invites', to: '/admin/invites' }, { label: 'Email', to: '/admin/email' } ] },
  { title: 'Markets', items: [ { label: 'Featured', to: '/admin/markets/featured' } ] },
  { title: 'Audit', items: [ { label: 'Audit Trail', to: '/admin/audit' } ] },
];

const titleForPath = (pathname: string): string => {
  if (pathname === '/admin') return 'Dashboard';
  if (pathname.startsWith('/admin/risk')) return 'Risk Management';
  if (pathname.startsWith('/admin/wallet')) return 'Wallet';
  if (pathname.startsWith('/admin/ops')) return 'Ops';
  if (pathname.startsWith('/admin/kyc')) return 'KYC Queue';
  if (pathname.startsWith('/admin/invites')) return 'Invite Codes';
  if (pathname.startsWith('/admin/email')) return 'Email Management';
  if (pathname.startsWith('/admin/users/search')) return 'Users — Search';
  if (pathname.startsWith('/admin/users/ledger')) return 'Users — Ledger';
  if (pathname.startsWith('/admin/markets/featured')) return 'Featured Candidates';
  if (pathname.startsWith('/admin/audit')) return 'Audit Trail';
  return 'Admin';
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { pathname } = useLocation();
  const resolved = title || titleForPath(pathname);
  return (
    <div className="admin-shell" style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <aside style={{ width: 220, borderRight: '1px solid #1f2937', background: '#0c0c0c' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #1f2937', fontWeight: 700 }}>BetMate — Admin</div>
        <nav style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {navGroups.map((g, gi) => (
            <div key={gi}>
              {g.title && <div style={{ padding: '6px 8px', color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>{g.title}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {g.items.map((n) => (
                  <NavLink key={n.to} exact to={n.to} activeClassName="admin-nav-active" className="admin-nav-item">
                    {n.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 1, background: '#0a0a0a', borderBottom: '1px solid #1f2937' }}>
          <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{resolved}</h1>
            <a href="/" style={{ marginLeft: 'auto', textDecoration: 'none', color: '#9ca3af', border: '1px solid #1f2937', padding: '6px 10px', borderRadius: 6 }}>
              ← Back to application
            </a>
          </div>
        </header>
        <div style={{ padding: 20 }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
