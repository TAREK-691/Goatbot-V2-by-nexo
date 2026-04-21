const fs = require("fs");
const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "2.2",
    author: "Ariyan",
    category: "events"
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      multiple1: "you",
      multiple2: "you guys",
      defaultWelcomeMessage:
`𝙰𝚂𝚂𝙰𝙻𝙰𝙼𝚄𝙰𝙻𝙰𝙸𝙺𝚄𝙼 {userNameTag}, 𝚠𝚎𝚕𝚌𝚘𝚖𝚎 {multiple} 𝚃𝚘 𝙾𝚞𝚛 {boxName} 𝙶𝚛𝚘𝚞𝚙😊
• 𝙸 𝙷𝚘𝚙𝚎 𝚈𝚘𝚞 𝚆𝚒𝚕𝚕 𝙵𝚘𝚕𝚕𝚘𝚠 𝙾𝚞𝚛 𝙶𝚛𝚘𝚞𝚙 𝚁𝚞𝚕𝚎𝚜
• {prefix}rules 𝚏𝚘𝚛 𝙶𝚛𝚘𝚞𝚙 𝚁𝚞𝚕𝚎𝚜
• {prefix}help 𝙵𝚘𝚛 𝙰𝚕𝚕 𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜

• 𝚈𝚘𝚞 𝙰𝚛𝚎 𝚃𝚑𝚎 {memberIndex} 𝙼𝚎𝚖𝚋𝚎𝚛{memberPlural} 𝚒𝚗 𝙾𝚞𝚛 𝙶𝚛𝚘𝚞𝚙
• 𝙰𝚍𝚍𝚎𝚍 𝙱𝚢: {inviterName}`
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang, usersData }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const prefix = global.utils.getPrefix(threadID);
    const dataAddedParticipants = event.logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();
    const threadData = await threadsData.get(threadID);
    const threadName = threadData.threadName;

    // ✅ Bot Added Function (copied from old file)
    const { nickNameBot } = global.GoatBot.config;
    if (dataAddedParticipants.some(user => user.userFbId == botID)) {
      if (nickNameBot)
        api.changeNickname(nickNameBot, threadID, botID);

      return message.send(
        `Thank you for inviting me to the group!\nBot prefix: ${prefix}\nTo view all commands: ${prefix}help`
      );
    }

    // 👤 Handle User Join
    if (!global.temp.welcomeEvent[threadID])
      global.temp.welcomeEvent[threadID] = {
        joinTimeout: null,
        dataAddedParticipants: []
      };

    global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
      const addedUsers = global.temp.welcomeEvent[threadID].dataAddedParticipants;
      const dataBanned = threadData.data.banned_ban || [];
      const mentions = [];
      const names = [];

      for (const user of addedUsers) {
        if (dataBanned.some(ban => ban.id == user.userFbId)) continue;
        names.push(user.fullName);
        mentions.push({ tag: user.fullName, id: user.userFbId });
      }

      if (names.length === 0) return;

      const welcomeMsgTemplate = threadData.data.welcomeMessage || getLang("defaultWelcomeMessage");
      const memberInfo = await api.getThreadInfo(threadID);
      const memberCount = memberInfo.participantIDs.length;

      const memberIndexList = [];
      for (let i = memberCount - names.length + 1; i <= memberCount; i++) {
        memberIndexList.push(i + getNumberSuffix(i));
      }

      const inviterName = await usersData.getName(event.author);
      const form = {
        body: welcomeMsgTemplate
          .replace(/\{userNameTag\}/g, names.join(", "))
          .replace(/\{multiple\}/g, names.length > 1 ? getLang("multiple2") : getLang("multiple1"))
          .replace(/\{boxName\}/g, threadName)
          .replace(/\{memberIndex\}/g, memberIndexList.join(", "))
          .replace(/\{memberPlural\}/g, names.length > 1 ? "s" : "")
          .replace(/\{inviterName\}/g, inviterName)
          .replace(/\{prefix\}/g, prefix),
        mentions
      };

      // Add welcome GIF link
      const welcomeGif = "https://files.catbox.moe/2i26vq.gif";
      
      if (threadData.data.welcomeAttachment) {
        const files = threadData.data.welcomeAttachment;
        const attachments = files.map(file => drive.getFile(file, "stream"));
        const attachmentPromises = (await Promise.allSettled(attachments))
          .filter(r => r.status === "fulfilled")
          .map(r => r.value);
        
        // Add welcome GIF as first attachment
        try {
          const welcomeGifStream = await global.utils.getStreamFromURL(welcomeGif);
          form.attachment = [welcomeGifStream, ...attachmentPromises];
        } catch (error) {
          form.attachment = attachmentPromises;
        }
      } else {
        // If no custom attachments, add only welcome GIF
        try {
          form.attachment = await global.utils.getStreamFromURL(welcomeGif);
        } catch (error) {
          console.error("Failed to load welcome GIF:", error);
        }
      }

      message.send(form);
      delete global.temp.welcomeEvent[threadID];
    }, 1500);
  }
};

function getNumberSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}
