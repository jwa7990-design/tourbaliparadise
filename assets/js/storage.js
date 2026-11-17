/* localStorage wrapper that never throws (private mode, blocked storage). */
export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  getJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
