<div align="center">

# 🍘 HR BOT

### Messenger Goat-style Command Bot
**DEVELOPER: SK HABIBULLA**

![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen) ![Railway](https://img.shields.io/badge/Deploy-Railway-blueviolet) ![FCA](https://img.shields.io/badge/sk--habibulla--fca-%5E0.2.0-orange)

</div>

A modular Messenger bot with group moderation and commands. **Unofficial FCA:** may stop working when Facebook changes and may trigger account limitations. The code assumes the package exposes the common `login({appState}, callback)` and `api.listenMqtt(callback)` interfaces; compatibility with `sk-habibulla-fca@0.2.0` has **not been verified against a live login**.

## 🚀 Deploy on Railway (GitHub)

1. Upload all project files to a **private GitHub repository** (or extract this ZIP, then push). Do not upload login cookies. `.gitignore` excludes `appstate.json`, `apostate.json`, `.env`, and `data/`.
2. Open [Railway](https://railway.com/) → New Project → Deploy from GitHub repo → select the repository.
3. In **Variables**, set:

   | Variable | Value |
   | --- | --- |
   | `APPSTATE_JSON` | **Full JSON array** of your own Messenger session cookies/AppState, as **one variable** |
   | `ADMIN_UIDS` | Your Facebook numeric UID. Multiple IDs separated by commas |
   | `PREFIX` | `!` |
   | `NODE_ENV` | `production` |
   | `ALLOW_GROUP_ADMINS` | `true` |
   | `DATA_DIR` | `/data` if a Railway Volume is mounted there; otherwise `./data` |

4. Deploy. Check **Deploy Logs** for `[FCA] HR BOT 🍘 logged in. UID: ...`. Then send `!help` in Messenger. The `/health` endpoint reports `connected:true` after FCA login.
5. For persistent bans/group settings between redeploys, add a Railway Volume and mount it at **`/data`**, with `DATA_DIR=/data`. Otherwise settings are temporary.
6. Use only **one Railway replica**, to avoid duplicate listeners to the same account.

**Local alternative:** paste your own JSON AppState into `appstate.json` or `apostate.json` (not both), create `.env` from `.env.example`, run `npm install` and `npm start`. `npm test` runs offline tests. Local files are not included when pushing via Git to Railway, so use `APPSTATE_JSON` there.

**Important:** Never paste your raw cookie or AppState into public chats, GitHub issues, README files, or public repos. Treat it as a password. Prefer a dedicated test account only if permitted under platform rules; using personal account cookies with unofficial APIs can expose or restrict the account. If compromised, log out sessions/change your password.

## Commands

| Command | Action | Permissions |
| --- | --- | --- |
| `!help`, `!help kick` | Commands/help | Everyone |
| `!ping`, `!uptime`, `!info` | Bot status | Everyone |
| `!uid`, `!admin` | UIDs/admin list | Everyone |
| `!echo hello` | Echo text | Everyone |
| `!threadinfo` | Group info | Everyone |
| `!settings` | Group settings | Everyone |
| `!nickname Name` | Set your nickname | Everyone |
| `!react ❤️` (reply) | React to replied message | Everyone |
| `!unsend` (reply) | Remove a bot-owned message | Everyone |
| `!welcome on/off` | New member welcome | Group admin / bot admin |
| `!goodbye on/off` | Goodbye | Group admin / bot admin |
| `!antilink on/off` | Link warning | Group admin / bot admin |
| `!antiunsend on/off` | Repost unsent **text** within 5 minutes | Group admin / bot admin |
| `!kick` (reply/mention/UID) | Remove member | Group admin / bot admin |
| `!ban UID`, `!unban UID` | Ban commands | Bot admin only |

**Limitations:** `antilink` warns; it does not delete or kick. Anti-unsend is OFF by default, caches only the last five minutes of short text messages and should be enabled only with group members' knowledge. `!kick`, nickname, react, and unsend depend on Messenger account permissions and FCA support.

## Structure

```text
hr-bot/
├── index.js
├── package.json
├── railway.json
├── .env.example
├── .gitignore
├── appstate.example.json
├── appstate.json          # local only, ignored by Git
├── apostate.json          # typo alias, local only, ignored by Git
├── src/
│   ├── bot.js
│   ├── commands/index.js
│   └── lib/{auth,fca,store}.js
└── tests/bot.test.js
```

### Troubleshooting

- **Missing or invalid session:** `APPSTATE_JSON` must contain actual JSON (starts with `[`), not your numeric UID, password, or cookie string alone.
- **Package not found / npm 404:** Confirm `sk-habibulla-fca@0.2.0` was published and is accessible to Railway/npm. If private, configure proper private-registry auth securely; never commit a token.
- **Login error / checkpoint / 2FA:** The FCA session may be invalid or blocked; sign in through the official Facebook app to review account security. This bot does not bypass checkpoints.
- **No replies:** Check Deploy Logs, group permissions, that your chosen prefix matches, and `connected` in `/health`.
- **Data lost after redeploy:** Attach a Railway Volume at `/data` and set `DATA_DIR=/data`.

© HR BOT 🍘 — Developer SK HABIBULLA
