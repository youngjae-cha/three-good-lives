// ============================================================
// Three Lives — GLS-15 survey responses → Google Sheet
// ------------------------------------------------------------
// SETUP:
//   1. Create a NEW Google Sheet (e.g. "three_lives_responses").
//   2. Extensions → Apps Script → delete the stub, paste THIS file, Save.
//   3. Deploy → New deployment → Web app → Execute as: Me, Who has access: ANYONE → Deploy.
//   4. Copy the /exec URL into FEEDBACK_URL in src/feedback.js.
//   (Later edits: Deploy → Manage deployments → ✎ → New version → Deploy — keeps the SAME URL.)
//
// ONE ROW PER PERSON, in the tab `responses`:
//   ts, ts_local, cid, passport_id, life_choice, h1..h5, m1..m5, r1..r5, zip
//   - life_choice = which life they aspired to (happy | meaningful | rich)
//   - h*/m*/r*    = the 15 GLS-15 item answers (1–7)
// Self-healing header (new columns auto-appear) + cid idempotency (retries never duplicate).
// ============================================================

var GLS_IDS = ['h1','h2','h3','h4','h5','m1','m2','m3','m4','m5','r1','r2','r3','r4','r5'];

// Append a row from a {field:value} object, self-healing the header (new fields → trailing columns).
function appendObj(sh, obj, order) {
  if (sh.getLastRow() === 0) sh.appendRow(order);
  var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  Object.keys(obj).forEach(function (k) {
    if (header.indexOf(k) < 0) { header.push(k); sh.getRange(1, header.length, 1, 1).setValue(k); }
  });
  sh.appendRow(header.map(function (c) { return obj.hasOwnProperty(c) ? obj[c] : ''; }));
}

// Idempotency: has this cid already been written? (so a client retry can never duplicate a row)
function cidExists(sh, cid) {
  if (sh.getLastRow() < 2) return false;
  var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var ci = header.indexOf('cid');
  if (ci < 0) return false;
  var col = sh.getRange(2, ci + 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) { if (col[i][0] === cid) return true; }
  return false;
}

function doPost(e) {
  var lock = LockService.getScriptLock();   // serialize writes so simultaneous submissions never collide
  try { lock.waitLock(20000); } catch (e2) { return out({ ok: false, error: 'busy' }); }
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('responses') || ss.insertSheet('responses');

    if (d.cid && cidExists(sh, d.cid)) return out({ ok: true, dup: true });  // idempotent: a client retry

    var obj = { ts: d.ts, ts_local: d.ts_local || '', cid: d.cid || '',
                passport_id: d.passport_id || '', life_choice: d.life_choice || '', zip: d.zip || '' };
    GLS_IDS.forEach(function (k) { obj[k] = (d[k] === undefined ? '' : d[k]); });  // the 15 item answers

    var order = ['ts', 'ts_local', 'cid', 'passport_id', 'life_choice'].concat(GLS_IDS).concat(['zip']);
    appendObj(sh, obj, order);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
