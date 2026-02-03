const KEY = 'betmate:device_id';

function generateId(): string {
  const t = Math.floor(Date.now() / 1000).toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `${t}-${r}`;
}

export function getDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing && existing.length > 0) return existing;
    const id = generateId();
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    return generateId();
  }
}

export default { getDeviceId };
