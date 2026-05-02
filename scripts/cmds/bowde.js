const fs = require("fs");

module.exports = {
  config: {
    name: "bowde",
    version: "1.0",
    author: "TAREK",
    countDown: 5,
    role: 0,
    shortDescription: "Randomly tag a female member as someone's 'wife'",
    longDescription: "Randomly selects a female from group and tags her as the user's 'wife'.",
    category: "fun",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const mentions = [];

    // Filter only female members
    const femaleMembers = threadInfo.userInfo.filter(
      user => !user.isGroupAdmin && user.gender === "FEMALE"
    );

    if (femaleMembers.length === 0) {
      return api.sendMessage("এই গ্রুপে কোনো মেয়ে মেম্বার নাই বেডা 😒", event.threadID);
    }

    // Pick a random girl
    const luckyGirl = femaleMembers[Math.floor(Math.random() * femaleMembers.length)];

    mentions.push({
      tag: luckyGirl.name,
      id: luckyGirl.id
    });

    const message = `এই নে বেডা তোর বউ 😏 @${luckyGirl.name} যা সংসার কইরা খা 🍳🧺`;

    api.sendMessage({
      body: message,
      mentions
    }, event.threadID);
  }
};
