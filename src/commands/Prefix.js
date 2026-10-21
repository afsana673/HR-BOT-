
"use strict";

// HR BOT 🍘
// Developer SK HABIBULLA

const PREFIX_RE = /^[^\p{L}\p{N}\s]{1,5}$/u;

function registerPrefixCommand(add) {
  add(
    "prefix",
    "Show or change prefix",
    "prefix [set <symbol>|reset]",
    "user",
    async (c) => {
      const action = (c.args[0] || "").toLowerCase();

      const canEdit =
        c.isBotAdmin ||
        (c.isGroup && c.isGroupAdmin);

      // Show current prefix
      if (!action || action === "show") {
        return c.reply(
          `🍘 HR BOT PREFIX SYSTEM\n\n` +
          `➤ Current Prefix: ${c.prefix}\n` +
          `➤ Example: ${c.prefix}help\n\n` +
          (canEdit
            ? `⚙️ Change Prefix:\n` +
              `${c.prefix}prefix set #\n\n` +
              `🔄 Reset Prefix:\n` +
              `${c.prefix}prefix reset\n\n`
            : `⚠️ Only Admin can change prefix.\n\n`) +
          `👑 Developer: SK HABIBULLA`
        );
      }

      // Validate action
      if (
        action !== "set" &&
        action !== "change" &&
        action !== "reset"
      ) {
        return c.reply(
          `❌ Invalid command!\n\n` +
          `Use: ${c.prefix}prefix set #`
        );
      }

      // Admin permission
      if (!canEdit) {
        return c.reply(
          "❌ Only HR BOT Admin or Group Admin can change prefix!"
        );
      }

      // Reset prefix
      if (action === "reset") {
        c.store.resetPrefix(c.threadID);

        return c.reply(
          `✅ Prefix Reset Successfully!\n\n` +
          `🍘 New Prefix: ${c.defaultPrefix}\n` +
          `➤ Try: ${c.defaultPrefix}help\n\n` +
          `👑 Developer SK HABIBULLA`
        );
      }

      // Set new prefix
      const next = c.args[1];

      if (!next || !PREFIX_RE.test(next)) {
        return c.reply(
          `❌ Invalid Prefix!\n\n` +
          `Use 1–5 symbols without spaces.\n` +
          `Example: ${c.prefix}prefix set #`
        );
      }

      const oldPrefix = c.prefix;

      c.store.setPrefix(c.threadID, next);

      return c.reply(
        `✅ PREFIX CHANGED SUCCESSFULLY!\n\n` +
        `🍘 Old Prefix: ${oldPrefix}\n` +
        `🍘 New Prefix: ${next}\n\n` +
        `➤ Try: ${next}help\n\n` +
        `👑 Developer SK HABIBULLA`
      );
    }
  );
}

module.exports = {
  registerPrefixCommand
};
