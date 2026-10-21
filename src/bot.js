'use strict';
const F = require('./lib/fca');
const {commands} = require('./commands');
const {createStore} = require('./lib/store');
const path = require('node:path');

function createBot(api, opts={}) {
  const prefix=opts.prefix || '!';
  const admins=new Set((opts.admins||[]).map(String));
  const botUID=String(api.getCurrentUserID());
  const store=createStore(opts.dataDir || path.resolve('./data'));
  const memory=new Map(); // Volatile, text-only, max ~5 minutes; opt-in per group
  const cleanInterval=setInterval(()=>{
    for(const [id,v] of memory) if(Date.now()-v.at>5*60*1000) memory.delete(id);
    if(memory.size>500) for(const id of [...memory.keys()].slice(0,memory.size-500)) memory.delete(id);
  },60000);
  cleanInterval.unref?.();
  async function reply(threadID,text,replyID) { return F.sendText(api,threadID,text,replyID); }
  async function isGroupAdmin(uid,threadID) {
    if(opts.allowGroupAdmins===false) return false;
    try {
      const info=await F.getThreadInfo(api,threadID);
      return (info.adminIDs||[]).some(x=>String(x.id ?? x)===String(uid));
    } catch(err) { console.warn('Cannot check group admins:',err.message); return false; }
  }
  async function handle(msg) {
    if(!msg || !msg.threadID) return;
    const type=msg.type;
    const threadID=String(msg.threadID);
    if(type==='event') {
      if(!msg.isGroup && !String(threadID).match(/^\d+$/)) return;
      const settings=store.getThread(threadID);
      if(msg.logMessageType==='log:subscribe' && settings.welcome) {
        const added=msg.logMessageData?.addedParticipants || [];
        const users=added.filter(x=>String(x.userFbId || x.userID)!==botUID);
        if(users.length) await reply(threadID,`🍘 Welcome to the group! ${users.map(x=>x.fullName||x.userFbId||'friend').join(', ')}\n— HR BOT`);
      }
      if(msg.logMessageType==='log:unsubscribe' && settings.goodbye) await reply(threadID,'🍘 A member left the group. Goodbye!');
      return;
    }
    if(type==='message_unsend') {
      const settings=store.getThread(threadID);
      const saved=memory.get(String(msg.messageID));
      memory.delete(String(msg.messageID));
      if(settings.antiunsend && saved && saved.threadID===threadID && saved.senderID!==botUID) {
        await reply(threadID,`🍘 A message was unsent by UID ${saved.senderID}:\n${saved.body}`);
      }
      return;
    }
    if(type!=='message' && type!=='message_reply') return;
    const senderID=String(msg.senderID);
    if(senderID===botUID || store.isBanned(senderID)) return;
    const body=String(msg.body||'').trim();
    const settings=store.getThread(threadID);
    const isGroup=threadID!==senderID;
    const receivedAt=Date.now();
    const isBotAdmin=admins.has(senderID);
    const begins=body.startsWith(prefix);
    if(settings.antiunsend && body && !begins && isGroup) {
      memory.set(String(msg.messageID),{threadID,senderID,body:body.slice(0,500),at:Date.now()});
    }
    if(!begins) {
      if(isGroup && settings.antilink && /https?:\/\/\S+|(?:www\.)\S+/i.test(body) && !isBotAdmin) {
        const allowed=await isGroupAdmin(senderID,threadID);
        if(!allowed) await reply(threadID,`🍘 Links are disabled here, UID ${senderID}.`);
      }
      return;
    }
    const words=body.slice(prefix.length).trim().split(/\s+/);
    const name=(words.shift()||'').toLowerCase();
    const command=commands.get(name);
    if(!command) return;
    const groupAdmin= isGroup && (command.role==='group-admin' || name==='help') ? await isGroupAdmin(senderID,threadID) : false;
    if(command.role==='bot-admin' && !isBotAdmin) return reply(threadID,'🍘 Only HR BOT administrators can use this command.',msg.messageID);
    if(command.role==='group-admin' && !isBotAdmin && !groupAdmin) return reply(threadID,'🍘 Only group administrators can use this command.',msg.messageID);
    try {
      await command.handler({api,msg,args:words,threadID,senderID,botUID,prefix,admins,store,isGroup,isBotAdmin,isGroupAdmin:groupAdmin,receivedAt,reply:(text)=>reply(threadID,text,msg.messageID)});
    } catch(err) {
      console.error(`[COMMAND ${name}]`,err);
      await reply(threadID,'🍘 Command failed. Check permissions and Railway logs.',msg.messageID).catch(()=>{});
    }
  }
  return { handle, store, botUID, prefix, stop:()=>clearInterval(cleanInterval) };
}
module.exports={createBot};
