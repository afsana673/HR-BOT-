'use strict';
require('dotenv').config();
const http=require('node:http');
const {loadState,loginFca}=require('./src/lib/auth');
const {createBot}=require('./src/bot');

const botStatus={name:'HR BOT 🍘',developer:'SK HABIBULLA',connected:false,startedAt:new Date().toISOString()};
const port=Number(process.env.PORT||3000);
const server=http.createServer((req,res)=>{
  const status=req.url==='/' || req.url==='/health';
  res.writeHead(status?200:404, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(status?{...botStatus,uptime:Math.round(process.uptime())}:{error:'Not found'}));
});
server.listen(port,'0.0.0.0',()=>console.log(`[HTTP] ${botStatus.name} listening on ${port}`));

let stopped=false, listening=null, retries=0, retryTimer=null;
function scheduleRetry(start) {
  if(stopped) return;
  const delay=Math.min(60000,Math.round(5000*Math.pow(1.65,Math.min(retries++,8))));
  console.warn(`[FCA] Reconnecting in ${delay/1000}s`);
  retryTimer=setTimeout(start,delay);
}
async function start() {
  if(stopped) return;
  try {
    const state=loadState();
    const login=require('sk-habibulla-fca');
    const api=await loginFca(login,state);
    if(typeof api.setOptions==='function') api.setOptions({listenEvents:true,selfListen:false,forceLogin:false,autoMarkDelivery:false,autoMarkRead:false});
    if(typeof api.listenMqtt!=='function') throw new Error('FCA package does not expose listenMqtt(); verify its API.');
    const bot=createBot(api,{prefix:process.env.PREFIX||'!',admins:(process.env.ADMIN_UIDS||'').split(',').map(x=>x.trim()).filter(Boolean),dataDir:process.env.DATA_DIR||'./data',allowGroupAdmins:process.env.ALLOW_GROUP_ADMINS!=='false'});
    retries=0;
    botStatus.connected=true;
    console.log(`[FCA] HR BOT 🍘 logged in. UID: ${bot.botUID}`);
    listening=api.listenMqtt((err,message)=>{
      if(err){
        if (!botStatus.connected) return;
        console.error('[FCA] Listener error:',err.message||err);
        botStatus.connected=false;
        try{listening?.stopListening?.();}catch{}
        scheduleRetry(start);
        return;
      }
      Promise.resolve(bot.handle(message)).catch(e=>console.error('[EVENT]',e.message));
    });
  } catch(err) {
    botStatus.connected=false;
    // Do not expose credentials in error logs
    console.error('[BOOT] Unable to start FCA:',err.message);
    if(/No session found|must be valid JSON|nonempty FCA appState array|not valid JSON/.test(err.message)) console.error('[BOOT] Configure APPSTATE_JSON in Railway Variables.');
    else scheduleRetry(start);
  }
}
process.on('SIGTERM',()=>{stopped=true;clearTimeout(retryTimer);try{listening?.stopListening?.();}catch{};server.close(()=>process.exit(0));});
process.on('SIGINT',()=>{stopped=true;clearTimeout(retryTimer);try{listening?.stopListening?.();}catch{};server.close(()=>process.exit(0));});
start();
