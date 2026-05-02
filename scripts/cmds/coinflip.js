const normalizeGuess = (raw) => {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (["h", "head", "heads", "হেড"].includes(s)) return "heads";
  if (["t", "tail", "tails", "টেইল"].includes(s)) return "tails";
  return null;
};

// Number formatter
const formatNumber = (num) => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toLocaleString();
};

module.exports = {
  config: {
    name: "coinflip",
    aliases: ["cf", "flip"],
    version: "4.0",
    author: "TAREK",
    role: 0,
    shortDescription: "Flip a coin with betting system",
    longDescription: "Flip a coin. Guess heads/tails and bet coins. Win = double coins!",
    category: "fun",
    guide: "{p}coinflip [heads|tails] [bet amount]\nExample: {p}coinflip heads 100",
  },

  onStart: async function ({ message, args, event, usersData }) {
    try {
      const userData = await usersData.get(event.senderID) || {};
      let userMoney = Number(userData.money) || 0;

      const guess = normalizeGuess(args[0]);
      const bet = parseInt(args[1]);

      // If user provided a bet, validate it
      if (!isNaN(bet)) {
        if (bet <= 0) return message.reply("⚠️ Bet must be greater than 0.");
        if (userMoney < bet) return message.reply(`💸 You only have ${formatNumber(userMoney)}$. Not enough to bet ${formatNumber(bet)}$!`);
      }

      // Flip
      const sides = ["heads", "tails"];
      const result = sides[Math.random() < 0.5 ? 0 : 1];

      const coinEmoji = "🪙";
      const art =
        result === "heads"
          ? `${coinEmoji}\n┌───────────┐\n│   HEADS   │\n└───────────┘`
          : `${coinEmoji}\n┌───────────┐\n│   TAILS   │\n└───────────┘`;

      let reply = `🎲 Coin flipped!\n${art}\n`;

      if (guess) {
        if (guess === result) {
          if (!isNaN(bet)) {
            userMoney += bet;
            userData.money = userMoney;
            await usersData.set(event.senderID, userData);
            reply += `\nYour guess: **${guess.toUpperCase()}**\n✅ You WIN! +${formatNumber(bet)}$\n💰 Balance: ${formatNumber(userMoney)}`;
          } else {
            reply += `\nYour guess: **${guess.toUpperCase()}**\n✅ You WIN!`;
          }
        } else {
          if (!isNaN(bet)) {
            userMoney -= bet;
            userData.money = userMoney;
            await usersData.set(event.senderID, userData);
            reply += `\nYour guess: **${guess.toUpperCase()}**\n❌ You LOSE! -${formatNumber(bet)}$\n💰 Balance: ${formatNumber(userMoney)}`;
          } else {
            reply += `\nYour guess: **${guess.toUpperCase()}**\n❌ You LOSE!`;
          }
        }
      } else {
        reply += `\nTip: try guessing heads or tails with a bet e.g. "coinflip heads 100" 😉`;
      }

      await message.reply(reply);
      await message.react("🪙");

    } catch (err) {
      console.error("[coinflip] error:", err);
      // Prevent sending internal error to user to avoid double message
    }
  },
};
