'use strict';
const fs = require('node:fs');
const path = require('node:path');

function createStore(dataDir) {
  const file = path.join(dataDir, 'settings.json');
  fs.mkdirSync(dataDir, { recursive: true });
  let data = { threads: {}, bans: {} };
  try {
    const loaded = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (loaded && typeof loaded === 'object') {
      data = {threads: loaded.threads || {}, bans: loaded.bans || {}};
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('[STORE] Settings unreadable; using defaults:', err.message);
  }
  function save() {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }
  function getThread(id) {
    const key = String(id);
    return data.threads[key] || { welcome:true, goodbye:true, antilink:false, antiunsend:false };
  }
  function setThread(id, patch) {
    data.threads[String(id)] = { ...getThread(id), ...patch };
    save();
    return data.threads[String(id)];
  }
  function isBanned(uid) { return !!data.bans[String(uid)]; }
  function setBan(uid, banned) {
    if (banned) data.bans[String(uid)] = true;
    else delete data.bans[String(uid)];
    save();
  }
  return { getThread, setThread, isBanned, setBan };
}
module.exports = { createStore };
