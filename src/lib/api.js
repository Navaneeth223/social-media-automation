const BASE = import.meta.env.VITE_API_URL || "";

/* Thin fetch wrapper: JSON in/out, cookies always sent (httpOnly JWT session),
   API errors thrown as Error with the server's message. */
async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Can't reach the Pulse API — start it with `npm run up` (repo root) or `npm run dev` inside server/."
    );
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response — leave data null */
  }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const getMe = () => api("/api/auth/me");
export const register = (payload) => api("/api/auth/register", { method: "POST", body: payload });
export const login = (payload) => api("/api/auth/login", { method: "POST", body: payload });
export const logout = () => api("/api/auth/logout", { method: "POST" });
