'use strict';
const F = require('../lib/fca');
const startedAt = Date.now();
const commands = new Map();
function add(name, description, syntax, role, handler) { commands.set(name, {name,description,syntax,role,handler}); }
function fmtDur(ms) { const s=Math.floor(ms/1000); return `${Math.floor(s/86400)}d ${Math.floor(s%86400/3600)}h ${Math.floor(s%3600/60)}m ${s%60}s`; }
function getTarget(msg, firstArg) {
  if (msg.messageReply?.senderID) return String(msg.messageReply.senderID);
  if (msg.mentions && Object.keys(msg.mentions).length) return Object.keys(msg.mentions)[0];
  if (/^\d{5,25}$/.test(firstArg || '')) return firstArg;
  return null;
}
add('help','Show commands','help [name]','user',async c => {
  const pick = c.args[0]?.toLowerCase();
  if (pick) { const cmd=commands.get(pick); return cmd ? c.reply(`${cmd.name} — ${cmd.description}\nUsage: ${c.prefix}${cmd.syntax}\nRole: ${cmd.role}`) : c.reply('Unknown command.'); }
  const allowed = [...commands.values()].filter(x => x.role==='user' || c.isBotAdmin || (c.isGroupAdmin && x.role==='group-admin'));
  return c.reply(`🍘 HR BOT | Developer SK HABIBULLA\n\n${allowed.map(x=>`${c.prefix}${x.syntax} — ${x.description}`).join('\n')}\n\nTotal commands: ${allowed.length}`);
});
add('ping','Check latency','ping','user',async c=>c.reply(`🍘 Pong! ${Date.now()-c.receivedAt}ms`));
add('uptime','Bot uptime','uptime','user',async c=>c.reply(`🍘 Uptime: ${fmtDur(Date.now()-startedAt)}`));
add('uid','Your or replied user UID','uid','user',async c=>c.reply(`UID: ${getTarget(c.msg,c.args[0]) || c.senderID}`));
add('info','Bot details','info','user',async c=>c.reply(`🍘 HR BOT\nDeveloper: SK HABIBULLA\nPrefix: ${c.prefix}\nPlatform: Messenger FCA\nUptime: ${fmtDur(Date.now()-startedAt)}`));
add('echo','Repeat text','echo <text>','user',async c=>c.reply(c.args.join(' ').slice(0,1000) || `Usage: ${c.prefix}echo <text>`));
add('admin','Display bot admins','admin','user',async c=>c.reply(`🍘 HR BOT Admin UID(s): ${[...c.admins].join(', ') || 'Not configured'}`));
add('threadinfo','Show group info','threadinfo','user',async c=>{
  if (!c.isGroup) return c.reply('Use inside a group.');
  const info=await F.getThreadInfo(c.api,c.threadID);
  return c.reply(`Group: ${info.threadName || '(unnamed)'}\nID: ${c.threadID}\nMembers: ${(info.participantIDs||[]).length}\nAdmins: ${(info.adminIDs||[]).length}`);
});
add('settings','Show group settings','settings','user',async c=>c.reply(`Group settings:\n${Object.entries(c.store.getThread(c.threadID)).map(([k,v])=>`${k}: ${v?'ON':'OFF'}`).join('\n')}`));
for (const setting of ['welcome','goodbye','antilink','antiunsend']) {
  add(setting,`Toggle ${setting}`,`${setting} on|off`,'group-admin', async c=>{
    if (!c.isGroup) return c.reply('Group-only command.');
    if (!['on','off'].includes(c.args[0]?.toLowerCase())) return c.reply(`Usage: ${c.prefix}${setting} on|off`);
    c.store.setThread(c.threadID, {[setting]:c.args[0].toLowerCase()==='on'});
    return c.reply(`${setting}: ${c.args[0].toUpperCase()}`);
  });
}
add('kick','Remove a group member','kick <reply|mention|uid>','group-admin',async c=>{
  if (!c.isGroup) return c.reply('Group-only command.');
  const target=getTarget(c.msg,c.args[0]);
  if (!target) return c.reply('Reply, mention, or provide a user UID.');
  if (target===c.botUID || c.admins.has(target) || target===c.senderID) return c.reply('Cannot remove bot/admin/self.');
  const info=await F.getThreadInfo(c.api,c.threadID);
  if ((info.adminIDs||[]).some(x=>String(x.id ?? x)===target)) return c.reply('Cannot remove a group admin.');
  await F.removeUser(c.api,target,c.threadID);
  return c.reply(`Removed UID ${target}`);
});
add('nickname','Set your nickname','nickname <new name>','user',async c=>{
  if (!c.isGroup) return c.reply('Group-only command.');
  const name=c.args.join(' ').trim();
  if (!name || name.length>60) return c.reply('Nickname must be 1–60 characters.');
  await F.nickname(c.api,name,c.threadID,c.senderID);
  return c.reply('Nickname updated.');
});
add('react','React to replied message','react <emoji>','user',async c=>{
  if (!c.msg.messageReply?.messageID || !c.args[0]) return c.reply(`Reply to a message: ${c.prefix}react ❤️`);
  await F.react(c.api,c.args[0],c.msg.messageReply.messageID);
});
add('unsend','Unsend bot message','unsend (reply to bot)','user',async c=>{
  const r=c.msg.messageReply;
  if (!r?.messageID || String(r.senderID)!==c.botUID) return c.reply('Reply to a message sent by HR BOT.');
  await F.unsend(c.api,r.messageID);
});
add('ban','Ban a user from bot commands','ban <reply|uid>','bot-admin',async c=>{
  const target=getTarget(c.msg,c.args[0]);
  if (!target || c.admins.has(target) || target===c.botUID) return c.reply('Specify a non-admin UID.');
  c.store.setBan(target,true); return c.reply(`Banned UID ${target} from commands.`);
});
add('unban','Unban a user','unban <uid>','bot-admin',async c=>{
  const target=getTarget(c.msg,c.args[0]);
  if (!target) return c.reply('Specify UID.');
  c.store.setBan(target,false); return c.reply(`Unbanned UID ${target}.`);
});
module.exports = { commands, getTarget };
