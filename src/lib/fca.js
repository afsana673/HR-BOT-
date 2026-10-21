'use strict';
function callbackCall(fn, args=[]) {
  return new Promise((resolve,reject) => {
    try {
      const out = fn(...args, (err, result) => err ? reject(err) : resolve(result));
      if (out && typeof out.then === 'function') out.then(resolve,reject);
    } catch (err) { reject(err); }
  });
}
function sendText(api, threadID, body, replyTo) {
  return new Promise((resolve,reject) => {
    try { api.sendMessage(String(body), String(threadID), (err, res) => err ? reject(err) : resolve(res), replyTo || undefined); }
    catch (err) { reject(err); }
  });
}
function getThreadInfo(api, threadID) { return callbackCall(api.getThreadInfo.bind(api), [String(threadID)]); }
function getUserInfo(api, uid) { return callbackCall(api.getUserInfo.bind(api), [String(uid)]); }
function removeUser(api, uid, threadID) { return callbackCall(api.removeUserFromGroup.bind(api),[String(uid),String(threadID)]); }
function unsend(api, messageID) { return callbackCall(api.unsendMessage.bind(api),[String(messageID)]); }
function react(api, emoji, messageID) { return callbackCall(api.setMessageReaction.bind(api),[emoji,String(messageID)]); }
function nickname(api, nick, threadID, uid) { return callbackCall(api.changeNickname.bind(api), [nick,String(threadID),String(uid)]); }
module.exports = { sendText, getThreadInfo, getUserInfo, removeUser, unsend, react, nickname };
