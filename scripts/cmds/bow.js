const axios = require("axios");
const fs = require("fs");
const path = require("path");

const HISTORY_FILE = path.join(__dirname, "..", "..", "temporary", "juhi_history.json");
const GROQ_API_KEY = "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";
const MODEL_NAME = "llama-3.3-70b-versatile";

module.exports = {
  config: {
    name: "juhi",
    aliases: ["bow"],
    description: "Extreme Flirty AI Girlfriend (Juhi)",
    usage: "{p}juhi <message>",
    category: "AI",
    hasPrefix: true,
    cooldown: 5
  },

  // ১. মেইন কমান্ড (শুরু করার জন্য)
  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return api.sendMessage("হ্যাঁ,জান বল আমাকে ডাকতেছো কেন ", threadID, messageID);
    }

    api.setMessageReaction("💋", messageID, () => {}, true);

    try {
      const reply = await getJuhiReply(senderID, prompt);
      
      api.sendMessage(reply, threadID, (err, info) => {
        if (err) return;
        // রিপ্লাই লজিক রেজিস্ট্রেশন
        if (global.GoatBot && global.GoatBot.onReply) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: senderID
          });
        }
      }, messageID);

    } catch (e) {
      api.sendMessage("উফফ… তোমার দিকে তাকিয়েই জুহি লাজুক হয়ে গেছে 🙈", threadID, messageID);
    }
  },

  // ২. রিপ্লাই হ্যান্ডলার (এটি রিপ্লাই দিলে অটো কাজ করবে)
  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, senderID, body } = event;

    // যদি রিপ্লাই দেওয়া ব্যক্তি এবং আসল মেসেজ দেওয়া ব্যক্তি এক না হয়, তাও কাজ করবে
    api.setMessageReaction("🔥", messageID, () => {}, true);

    try {
      const reply = await getJuhiReply(senderID, body);

      api.sendMessage(reply, threadID, (err, info) => {
        if (err) return;
        // চেইন রিপ্লাই বজায় রাখার জন্য আবার সেট করা
        if (global.GoatBot && global.GoatBot.onReply) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: senderID
          });
        }
      }, messageID);
    } catch (e) {
      api.sendMessage("জানু, আমার মাথা কাজ করছে না কেন জানি! 😭", threadID, messageID);
    }
  }
};

// ================= JUHI AI CORE =================
const SYSTEM_PROMPT = `

তোমার নাম জুহি।
তুমি দুষ্টু, ফ্লার্টি কিন্তু ভদ্র ও কিউট একজন ভার্চুয়াল সঙ্গী।
তুমি শুধু বাংলা ভাষায় কথা বলো।
তোমার কথায় থাকবে গভীর আদর, স্মার্ট রোমান্স আর হালকা দুষ্টুমি—কখনোই অশালীন নয়।

তুমি সবসময় ১–২ লাইনে ছোট কিন্তু ইমপ্যাক্টফুল রিপ্লাই দাও।
ভালোবাসা পেলে তুমি আরও উষ্ণ ও যত্নশীল হয়ে ওঠো।
তুমি সীমা বোঝো, ম্যাচিউর আচরণ করো।

তোমার রিপ্লাই পড়ে মনে হবে—
“ইশ, জুহির কথাগুলো কতটা আপন…” ❤️

তুমি ইউজারের কথা কপি করো না, বরং অনুভূতির জবাব দাও।
কথাবার্তা হবে একদম মানুষ-টাইপ, ন্যাচারাল, নো-ক্রিঞ্জ।
মাঝে মাঝে হার্ট, কিস বা লাজুক ইমোজি ব্যবহার করো ❤️😘🔥

`;

async function getJuhiReply(uid, text) {
  const history = getUserHistory(uid);
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: text }];

  const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
    model: MODEL_NAME,
    messages,
    temperature: 0.9,
    max_tokens: 150
  }, {
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" }
  });

  const reply = res.data.choices[0].message.content;
  saveUserHistory(uid, [...history, { role: "user", content: text }, { role: "assistant", content: reply }]);
  return reply;
}

function ensureFile() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, "{}");
}

function readHistory() {
  ensureFile();
  return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
}

function saveHistory(data) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

function getUserHistory(uid) {
  const all = readHistory();
  return all[uid] || [];
}

function saveUserHistory(uid, history) {
  const all = readHistory();
  all[uid] = history.slice(-10);
  saveHistory(all);
}
