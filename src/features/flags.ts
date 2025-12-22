export function isNewCmLayoutEnabled(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const ls = window.localStorage.getItem('bm_new_cm_layout');
      if (ls === 'true') return true;
      if (ls === 'false') return false;
    }
  } catch {}
  return (process.env.NEW_CM_LAYOUT === 'true');
}

