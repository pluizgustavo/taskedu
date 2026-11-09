export function allowedOrigin(origin, configured) {
  if (!origin || configured.includes(origin)) return true;
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.origin === origin;
  } catch { return false; }
}
