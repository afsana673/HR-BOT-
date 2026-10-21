'use strict';
const fs = require('node:fs');
const path = require('node:path');

function parseState(raw, source) {
  let obj;
  try { obj = JSON.parse(raw); } catch { throw new Error(`${source} must be valid JSON`); }
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch { throw new Error(`${source} has invalid nested JSON`); }
  }
  if (!Array.isArray(obj) || obj.length === 0) throw new Error(`${source} must be a nonempty FCA appState array`);
  return obj;
}
function loadState() {
  if (process.env.APPSTATE_JSON?.trim()) return parseState(process.env.APPSTATE_JSON, 'APPSTATE_JSON');
  const sources = ['appstate.json','apostate.json'];
  for (const name of sources) {
    const filename = path.join(process.cwd(), name);
    if (!fs.existsSync(filename)) continue;
    const raw = fs.readFileSync(filename, 'utf8');
    let candidate;
    try { candidate = JSON.parse(raw); } catch { throw new Error(`${name} is not valid JSON`); }
    if (Array.isArray(candidate) && candidate.length === 0) continue;
    return parseState(raw, name);
  }
  throw new Error('No session found. Set Railway APPSTATE_JSON or fill local appstate.json / apostate.json (never commit credentials).');
}
function loginFca(login, appState) {
  return new Promise((resolve,reject) => {
    let done = false;
    const timeout = setTimeout(() => finish(new Error('FCA login timed out after 60 seconds')), 60000);
    function finish(err, api) {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      if (err) reject(err);
      else if (!api) reject(new Error('FCA login returned no API'));
      else resolve(api);
    }
    try {
      const value = login({ appState }, finish);
      if (value && typeof value.then === 'function') value.then(api => finish(null,api),finish);
    } catch (err) { finish(err); }
  });
}
module.exports = { loadState, loginFca };
