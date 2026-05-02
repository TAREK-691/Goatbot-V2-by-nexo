const axios = require("axios");
const fs = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "flas",
    version: "1.0",
    author: "Tarek",
    countDown: 5,
    role: 0,
    shortDescription: "Toilet meme",
    longDescription: "Put the mentioned user into a toilet image",
    category: "fun",
    guide: {
      en: "{pn} @mention"
    }
  },

  onStart: async function ({ event, message, usersData }) {
    const uid = Object.keys(event.mentions)[0];
    if (!uid) return message.reply("Please mention someone!");

    try {
      const baseImageUrl = "https://res.cloudinary.com/mahiexe/image/upload/v1748260428/mahi/1748260427676-732917239.jpg";
      const userAvatarUrl = await usersData.getAvatarUrl(uid);

      const [bgImg, avImg] = await Promise.all([
        loadImage(baseImageUrl),
        loadImage(userAvatarUrl)
      ]);

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height);
      ctx.save();

      // Draw user avatar on toilet (adjust position/size if needed)
      const avatarSize = 140;
      const avatarX = 135;
      const avatarY = 296;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      const path = `${__dirname}/flas-${uid}.png`;
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(path, buffer);

      message.reply({
        body: `Hehe... You just got flushed!`,
        attachment: fs.createReadStream(path)
      }, () => fs.unlinkSync(path));

    } catch (e) {
      console.error(e);
      message.reply("Something went wrong!");
    }
  }
};
