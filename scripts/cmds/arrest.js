const axios = require("axios");
const fs = require("fs-extra");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "arrest",
    aliases: ["ar"],
    version: "3.2",
    author: "TAREK",
    countDown: 5,
    role: 0,
    shortDescription: "Police vs Criminal arrest poster",
    longDescription: "The command giver becomes criminal, the mentioned/replied user becomes the police.",
    category: "fun",
    guide: {
      en: "{pn} @mention or reply"
    }
  },

  onStart: async function ({ event, message, usersData }) {
    try {
      let policeID;

      if (Object.keys(event.mentions).length > 0) {
        policeID = Object.keys(event.mentions)[0];
      } else if (event.messageReply) {
        policeID = event.messageReply.senderID;
      } else {
        return message.reply("❌ Please mention someone or reply to a message.");
      }

      const criminalID = event.senderID;

      // Arrest template (background)
      const arrestBg = "https://drive.google.com/uc?export=download&id=1GfOEq57tcbM3CjQxF1igsT7ySmTmVnI1";

      // Profile pics
      const policeAvatarURL = await usersData.getAvatarUrl(policeID);
      const criminalAvatarURL = await usersData.getAvatarUrl(criminalID);

      // Names
      const policeName = await usersData.getName(policeID); // Mentioned/replied user's name
      const criminalName = await usersData.getName(criminalID); // Command giver

      // Load background
      const bg = await Canvas.loadImage(arrestBg);
      const canvas = Canvas.createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // Load avatars
      const policeAvatar = await Canvas.loadImage(policeAvatarURL);
      const criminalAvatar = await Canvas.loadImage(criminalAvatarURL);

      // Draw police avatar (circle)
      const x1 = 350, y1 = 100, size1 = 200;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x1 + size1/2, y1 + size1/2, size1/2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(policeAvatar, x1, y1, size1, size1);
      ctx.restore();

      // Draw criminal avatar (circle)
      const x2 = 740, y2 = 60, size2 = 200;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x2 + size2/2, y2 + size2/2, size2/2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(criminalAvatar, x2, y2, size2, size2);
      ctx.restore();

      // Save file
      const filePath = path.join(__dirname, "arrest.png");
      fs.writeFileSync(filePath, canvas.toBuffer());

      // Send message
      await message.reply({
        body: `🚨 𝘆𝗼𝘂 𝗮𝗿𝗲 𝘂𝗻𝗱𝗲𝗿 𝗮𝗿𝗿𝗲𝘀𝘁 ${policeName}`, // Mentioned/replied user's name
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (e) {
      console.error(e);
      message.reply("⚠️ Something went wrong.");
    }
  }
};
