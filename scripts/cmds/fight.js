module.exports = {
  config: {
    name: "fight",
    aliases: ["battle", "f"],
    countdown: 5,
    author: "T A N J I L 🎀",
    role: 0,
    category: "game",
    shortDescription: {
      en: "Fight against another user for EXP!"
    },
    longDescription: {
      en: "Challenge someone to a battle using /fight @user. Win to earn EXP! No balance required to play."
    },
    guide: {
      en: `
➤ Usage:
• /fight @mention

➤ Reward:
• Winner gets: 300 EXP

➤ Valid Moves:
• punch
• kick
• slap`
    }
  },

  // START: Fight Handler
  onStart: async function ({ event, args, message, usersData }) {
    const senderID = event.senderID;
    const threadID = event.threadID;
    const mention = Object.keys(event.mentions)[0];

    if (!mention)
      return message.reply("Please mention someone to fight. Example: /fight @user");

    if (mention === senderID)
      return message.reply("You can't fight yourself! 😤");

    const senderData = await usersData.get(senderID);
    const mentionData = await usersData.get(mention);

    const players = [
      { id: senderID, hp: 100, name: senderData.name },
      { id: mention, hp: 100, name: mentionData.name }
    ];

    const currentTurn = Math.random() < 0.5 ? 0 : 1;

    message.reply(
      `👊 Fight Started Between ${players[0].name} and ${players[1].name}!\n🎲 Random pick: ${players[currentTurn].name} will start.`
    );

    if (!global.fightGames) global.fightGames = {};
    global.fightGames[threadID] = {
      players,
      turn: currentTurn,
      threadID,
      timeout: setTimeout(async () => {
        const game = global.fightGames[threadID];
        if (!game) return;

        const [player1, player2] = game.players;
        let winner;

        if (player1.hp > player2.hp) winner = player1;
        else if (player2.hp > player1.hp) winner = player2;
        else winner = null;

        if (winner) {
          const userData = await usersData.get(winner.id);
          const expToAdd = 300;
          await usersData.set(winner.id, {
            exp: (userData.exp || 0) + expToAdd
          });

          await message.reply(
            `⌛ Time's up! 🕐\n🏁 ${winner.name} wins by having higher HP!\n🎉 Reward: ${expToAdd} EXP earned!`
          );
        } else {
          await message.reply("⌛ Time's up! It's a draw! 🤝 No one wins.");
        }

        delete global.fightGames[threadID];
      }, 60000) // 1 minute = 60000 ms
    };
  },

  // START: Handle Chat During Fight
  onChat: async function ({ event, message, usersData }) {
    const validMoves = ["kick", "punch", "slap"];
    const senderID = event.senderID;
    const threadID = event.threadID;
    const input = event.body.toLowerCase();

    if (!global.fightGames || !global.fightGames[threadID]) return;

    const game = global.fightGames[threadID];
    const { players, turn } = game;

    if (!players.some(p => p.id === senderID)) {
      return message.reply("🚫 You're not part of this fight. Stay away or you're next!");
    }

    if (players[turn].id !== senderID) {
      return message.reply(`⏳ Not your turn! It's ${players[turn].name}'s move.`);
    }

    if (!validMoves.includes(input)) return;

    clearTimeout(game.timeout); // Reset timer

    const damage = Math.floor(Math.random() * 100) + 1;
    const opponent = players[1 - turn];
    opponent.hp -= damage;
    if (opponent.hp < 0) opponent.hp = 0;

    const getHpBar = (hp) => {
      const barLen = 20;
      const filled = Math.round((hp / 100) * barLen);
      return "█".repeat(filled) + "░".repeat(barLen - filled) + ` (${hp}%)`;
    };

    await message.reply(
      `💥 ${players[turn].name} used ${input.toUpperCase()}!\n🩸 ${opponent.name} lost ${damage} HP!\n\n` +
      `👤 ${players[0].name} → ${getHpBar(players[0].hp)}\n` +
      `👤 ${players[1].name} → ${getHpBar(players[1].hp)}`
    );

    if (opponent.hp > 0) {
      const nextTurn = 1 - turn;
      game.turn = nextTurn;
      game.timeout = setTimeout(async () => {
        const [player1, player2] = game.players;
        let winner;

        if (player1.hp > player2.hp) winner = player1;
        else if (player2.hp > player1.hp) winner = player2;
        else winner = null;

        if (winner) {
          const userData = await usersData.get(winner.id);
          const expToAdd = 300;
          await usersData.set(winner.id, {
            exp: (userData.exp || 0) + expToAdd
          });

          await message.reply(
            `⌛ Time's up! 🕐\n🏁 ${winner.name} wins by having higher HP!\n🎉 Reward: ${expToAdd} EXP earned!`
          );
        } else {
          await message.reply("⌛ Time's up! It's a draw! 🤝 No one wins.");
        }

        delete global.fightGames[threadID];
      }, 60000); // 1 min reset
      await message.reply(`👉 It's now ${players[nextTurn].name}'s turn!`);
    } else {
      const winner = players[turn];
      const userData = await usersData.get(winner.id);
      const expToAdd = 300;

      await usersData.set(winner.id, {
        exp: (userData.exp || 0) + expToAdd
      });

      await message.reply(
        `🏁 ${winner.name} wins the fight! 🏆\n🎉 Reward: ${expToAdd} EXP earned!`
      );

      clearTimeout(game.timeout);
      delete global.fightGames[threadID];
    }
  }
};
