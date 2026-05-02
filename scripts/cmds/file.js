const fs = require('fs');

module.exports = {
	config: {
		name: "file",
		aliases: ["files"],
		version: "1.0",
		author: "Mahir Tahsan",
		countDown: 5,
		role: 0,
		shortDescription: "Send bot script",
		longDescription: "Send bot specified file ",
		category: "𝗢𝗪𝗡𝗘𝗥",
		guide: "{pn} file name. Ex: .{pn} filename"
	},

	onStart: async function ({ message, args, api, event }) {
		const permission = ["100047994102529","61577095705293",];
		if (!permission.includes(event.senderID)) {
			return api.sendMessage(" 😹 𝗧𝘂𝗺𝗶 𝗰𝗼𝗺𝗺𝗮𝗻𝗱 𝗰𝗵𝗮𝗹𝗮𝘁𝗲 𝗰𝗵𝗮𝗼? 𝗔𝘄𝘄 𝗯𝗮𝗯𝘆, 𝘁𝗼𝗼 𝗰𝘂𝘁𝗲! 𝗕𝘂𝘁 𝗻𝗼𝗼𝗼... 🐤", event.threadID, event.messageID);
		}

		const fileName = args[0];
		if (!fileName) {
			return api.sendMessage("📝 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐟𝐢𝐥𝐞𝐧𝐚𝐦𝐞 𝐨𝐫 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚 𝐟𝐢𝐥𝐞..🙂", event.threadID, event.messageID);
		}

		const filePath = __dirname + `/${fileName}.js`;
		if (!fs.existsSync(filePath)) {
			return api.sendMessage(`File not found: ${fileName}.js`, event.threadID, event.messageID);
		}

		const fileContent = fs.readFileSync(filePath, 'utf8');
		api.sendMessage({ body: fileContent }, event.threadID);
	}
};
