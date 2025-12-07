#!/usr/bin/env node
/* Notify Discord of a successful frontend production deploy (Netlify) */

const webhook = process.env.DISCORD_WEBHOOK_URL_FE;
const context = process.env.CONTEXT || '';
const siteUrl = process.env.URL || process.env.DEPLOY_URL || '';
const branch = process.env.BRANCH || '';
const buildTime = process.env.BUILD_TIME || new Date().toISOString();
const pkgVersion = process.env.npm_package_version || '0.0.0';

async function main() {
  // Only in production and when webhook configured
  if (context !== 'production') {
    console.log('[notify-discord] Skipping (context != production):', context);
    return;
  }
  if (!webhook) {
    console.log('[notify-discord] Skipping (missing DISCORD_WEBHOOK_URL_FE)');
    return;
  }

  const content = {
    content: null,
    embeds: [
      {
        title: '✅ BetMate Frontend Deployed',
        description: 'Production site updated successfully.',
        color: 0x33cc99,
        fields: [
          { name: 'When', value: new Date(buildTime).toUTCString(), inline: false },
          ...(siteUrl ? [{ name: 'URL', value: siteUrl, inline: false }] : []),
          ...(branch ? [{ name: 'Branch', value: branch, inline: true }] : []),
          { name: 'Version', value: `v${pkgVersion}`, inline: true },
        ],
      },
    ],
  };

  try {
    const resp = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });
    if (!resp.ok) {
      console.error('[notify-discord] Failed:', resp.status, await resp.text());
      process.exit(0); // do not fail build on notify error
    } else {
      console.log('[notify-discord] Sent');
    }
  } catch (err) {
    console.error('[notify-discord] Error:', err);
  }
}

// Node 18+ has global fetch; provide fallback if not
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

main();

