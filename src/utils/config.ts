export const moveOptionColors = ['#00B6FF', '#64FF8F', '#FFC702', '#FF00B7'];

// Feature flags and environment-driven toggles
// Disable global leaderboard endpoints by default in production builds,
// unless explicitly overridden via DISABLE_GLOBAL_LEADERBOARD.
const RAW_DISABLE_GL = process.env.DISABLE_GLOBAL_LEADERBOARD;
const IS_PROD_TARGET = process.env.TARGET_ENV === 'prod' || process.env.NODE_ENV === 'production';
export const DISABLE_GLOBAL_LEADERBOARD = (
  RAW_DISABLE_GL === 'true'
  || (RAW_DISABLE_GL == null && IS_PROD_TARGET)
);

// Gate Real deposits visibility in UI (default false in prod)
const RAW_ENABLE_REAL_DEPOSITS = process.env.ENABLE_REAL_DEPOSITS;
export const ENABLE_REAL_DEPOSITS = (
  RAW_ENABLE_REAL_DEPOSITS === 'true' || (!IS_PROD_TARGET && RAW_ENABLE_REAL_DEPOSITS !== 'false')
);

// Build frontend-facing success/cancel URLs used by NOWPayments redirects
const FRONTEND_BASE = (typeof window !== 'undefined' && window.location?.origin)
  ? window.location.origin
  : (process.env.FRONTEND_PUBLIC_URL || 'http://localhost:8080');

export const PAYMENT_SUCCESS_URL = (
  process.env.NOWPAYMENTS_SUCCESS_URL || `${FRONTEND_BASE}/wallet?status=success`
);

export const PAYMENT_CANCEL_URL = (
  process.env.NOWPAYMENTS_CANCEL_URL || `${FRONTEND_BASE}/wallet?status=cancel`
);

// Helpful for dev: show deposit IDs in Wallet list to copy during testing
export const SHOW_DEPOSIT_IDS = (
  process.env.SHOW_DEPOSIT_IDS === 'true' || !IS_PROD_TARGET
);

// Dev convenience: enable faucet button when not targeting prod (or if explicitly toggled)
export const ENABLE_DEV_FAUCET = (
  process.env.ENABLE_DEV_FAUCET === 'true' || (!IS_PROD_TARGET && process.env.ENABLE_DEV_FAUCET !== 'false')
);

// Optional: include admin key header for staging faucet calls (avoid in prod)
export const FAUCET_ADMIN_KEY = process.env.FAUCET_ADMIN_KEY || '';

// New Game UI flag was used during migration and is now deprecated.
// Retained here as a no-op for compatibility; always returns true since new UI is canonical.
export function isNewGameUiEnabled(): boolean { return true; }
