const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "fingering",
    aliases: ["fg"],
    version: "1.1",
    author: "Jun",
    countDown: 5,
    role: 2,
    shortDescription: "fingering",
    longDescription: "",
    category: "18+",
    guide: "{pn}"
  },

  onLoad: async function () {
    const pathImg = path.resolve(__dirname, "fingeringv2.png");
    try {
      if (!fs.existsSync(pathImg)) {
        const response = await axios.get(
          "https://drive.google.com/uc?export=download&id=1HEIUVZXrUgxbJOCkr7h6c9_eeyGgzr3V",
          { responseType: "arraybuffer" }
        );
        fs.writeFileSync(pathImg, Buffer.from(response.data));
        console.log("✅ fingeringv2.png downloaded successfully");
      }
    } catch (e) {
      console.error("❌ Failed to download fingeringv2.png", e);
    }
  },

  circle: async function (image) {
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
  },

  makeImage: async function ({ one, two }) {
    const templatePath = path.resolve(__dirname, "fingeringv2.png");
    if (!fs.existsSync(templatePath)) {
      throw new Error("❌ Template image fingeringv2.png not found!");
    }

    const pathImg = path.resolve(__dirname, `fingering_${one}_${two}.png`);
    const avatarOne = path.resolve(__dirname, `avt_${one}.png`);
    const avatarTwo = path.resolve(__dirname, `avt_${two}.png`);

    // Download avatars
    const getAvatar = async (id, savePath) => {
      const data = (await axios.get(
        `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )).data;
      fs.writeFileSync(savePath, Buffer.from(data));
    };

    await getAvatar(one, avatarOne);
    await getAvatar(two, avatarTwo);

    // Circle crop avatars
    const circleOne = await jimp.read(await this.circle(avatarOne));
    const circleTwo = await jimp.read(await this.circle(avatarTwo));

    // Base template
    const baseImg = await jimp.read(templatePath);
    baseImg.composite(circleOne.resize(70, 70), 180, 110);
    baseImg.composite(circleTwo.resize(70, 70), 120, 140);

    // Save final image
    const raw = await baseImg.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, raw);

    // Cleanup
    fs.unlinkSync(avatarOne);
    fs.unlinkSync(avatarTwo);

    return pathImg;
  },

  onStart: async function ({ event, api }) {
    const { threadID, messageID, senderID, messageReply } = event;
    const mention = Object.keys(event.mentions);

    let targetID;

    // Priority: reply > mention
    if (messageReply && messageReply.senderID) {
      targetID = messageReply.senderID;
    } else if (mention[0]) {
      targetID = mention[0];
    } else {
      return api.sendMessage("⚠️ Please mention or reply to 1 person.", threadID, messageID);
    }

    const one = senderID;
    const two = targetID;

    this.makeImage({ one, two })
      .then(filePath => {
        api.sendMessage(
          { body: "", attachment: fs.createReadStream(filePath) },
          threadID,
          () => fs.unlinkSync(filePath),
          messageID
        );
      })
      .catch(err => {
        api.sendMessage("❌ Error: " + err.message, threadID, messageID);
      });
  }
};
