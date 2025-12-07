// Build-time version metadata, with safe fallbacks for local dev
// Prefer a human-friendly build date for display

export const buildTimeISO: string = process.env.BUILD_TIME || new Date().toISOString();

export const environment: string =
  (process.env.TARGET_ENV as string) || (process.env.NODE_ENV as string) || 'development';

// Keep package version for diagnostics (not shown in UI by default)
export const packageVersion: string = (process.env.npm_package_version as string) || '0.0.0';

// Optional build context fields (Netlify)
export const buildContext: string = (process.env.BUILD_CONTEXT as string) || '';
export const buildUrl: string = (process.env.BUILD_URL as string) || '';
export const buildBranch: string = (process.env.BUILD_BRANCH as string) || '';

// Preformatted label for UI: product name + semantic version
const envLower = (environment || '').toLowerCase();
const isDevLabel = envLower === 'dev' || envLower === 'development';
export const versionLabel: string = `BetMate v${packageVersion}${isDevLabel ? ' (dev)' : ''}`;

export default {
  buildTimeISO,
  environment,
  packageVersion,
  buildContext,
  buildUrl,
  buildBranch,
  versionLabel,
};
