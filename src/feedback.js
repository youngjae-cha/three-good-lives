// =====================================================================
// Durable, acknowledged delivery for the Three Lives survey.
// Same pattern as the Chicago map: every record carries a unique cid
// (idempotency key) and sits in a localStorage OUTBOX; it's sent in CORS
// mode so we can READ the {ok:true} acknowledgement. Unconfirmed sends
// retry (backoff + on next load). The server dedups on cid, so retries
// can never create a duplicate row.
// =====================================================================

// ⬇️ PASTE the Apps Script /exec URL here after you deploy apps_script.gs:
export const FEEDBACK_URL = "https://script.google.com/macros/s/AKfycbwajMgsMBZtBp7neUImMgNR3Gy_FTTD_gR6nBXchuSgOXcsQQ-11S574KMaEX-SK1Fi/exec";

const _inflight = {};
export function newCid() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}
function _outbox() { return JSON.parse(localStorage.getItem("tl_outbox") || "[]"); }
function _save(o) { localStorage.setItem("tl_outbox", JSON.stringify(o)); }
function _remove(cid) { _save(_outbox().filter((r) => r.cid !== cid)); delete _inflight[cid]; }
function _bump(cid) {
  const o = _outbox();
  for (let i = 0; i < o.length; i++) {
    if (o[i].cid === cid) { o[i]._tries = (o[i]._tries || 0) + 1; if (o[i]._tries > 6) o.splice(i, 1); break; }
  }
  _save(o); delete _inflight[cid];   // give up after 6 safe (deduped) retries
}

export function queueSend(rec) { const o = _outbox(); o.push(rec); _save(o); flushOutbox(); }

export function flushOutbox() {
  if (!FEEDBACK_URL || FEEDBACK_URL.indexOf("PASTE") === 0) return;   // not wired up yet
  _outbox().forEach((rec) => {
    if (_inflight[rec.cid]) return;
    _inflight[rec.cid] = 1;
    const t = rec._tries || 0;
    const delay = t ? Math.min(8000, 500 * Math.pow(2, t)) : Math.floor(Math.random() * 1200); // jitter then backoff
    setTimeout(() => {
      fetch(FEEDBACK_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(rec) })
        .then((r) => r.json())
        .then((res) => { if (res && res.ok) _remove(rec.cid); else _bump(rec.cid); })
        .catch(() => _bump(rec.cid));  // network/CORS-read failure → retry (server dedups on cid, so safe)
    }, delay);
  });
}

// ---- Mindworks Passport (session-based, event-gated) — same rules as the Chicago map ----
export const EVENT_START = "2026-06-24T00:00:00", EVENT_END = "2026-06-26T12:00:00";
export function inEventWindow() {
  const n = new Date();
  return n >= new Date(EVENT_START) && n <= new Date(EVENT_END);
}
export function passportId() { return sessionStorage.getItem("tl_passport") || ""; }
export function passportAsked() { return sessionStorage.getItem("tl_passport_set") === "1"; }
export function setPassport(v) { sessionStorage.setItem("tl_passport", v); sessionStorage.setItem("tl_passport_set", "1"); }
export function validPassport(v) { return /^[A-Z]{3}[0-9]{5}$/.test((v || "").trim().toUpperCase()); }

// Should we prompt for a passport now? (in the event window OR forced via ?passporttest=1, and not yet asked)
export function shouldAskPassport() {
  const forced = location.search.indexOf("passporttest=1") >= 0;
  return (inEventWindow() || forced) && !passportAsked();
}
