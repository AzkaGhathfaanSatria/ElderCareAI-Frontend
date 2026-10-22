export interface ParsedRtsp {
  host: string;
  port: string;
  username: string;
  password: string;
  path: string;
}

/** Pecah URL RTSP lengkap menjadi kolom IP, port, user, password, dan path. */
export function parseRtsp(raw: string): ParsedRtsp | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "rtsp:" || !u.hostname) return null;
    return {
      host: u.hostname,
      port: u.port,
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      path: u.pathname + u.search,
    };
  } catch {
    return null;
  }
}
