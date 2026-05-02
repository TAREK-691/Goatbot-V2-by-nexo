const math = require('mathjs');

module.exports = {
  config: {
    name: "calc",
    version: "1.1",
    author: "Tarek",
    countDown: 1,
    role: 0,
    shortDescription: "Smart Calculator",
    longDescription: "Performs both normal and scientific calculations.",
    category: "utility",
    guide: {
      en: `
📘 Usage Guide for /calc:

🔹 Basic Arithmetic:
- /calc 5 + 3            → 8
- /calc 20 - 5           → 15
- /calc 4 * 6            → 24
- /calc 24 / 3           → 8
- /calc (10 + 5) * 2     → 30

🔹 Scientific Functions:
- /calc sqrt(25)         → 5
- /calc pow(2, 3)        → 8
- /calc 2^3              → 8
- /calc abs(-10)         → 10
- /calc log(100)         → 2
- /calc log10(1000)      → 3

🔹 Trigonometry (use 'deg' for degrees):
- /calc sin(90 deg)      → 1
- /calc cos(0 deg)       → 1
- /calc tan(45 deg)      → 1

🔹 Constants:
- /calc pi               → 3.141592...
- /calc e                → 2.71828...

🔹 Mixed Expressions:
- /calc sqrt(16) + pow(2, 4)     → 4 + 16 = 20
- /calc sin(30 deg) * 100        → 50
- /calc (10 + 5) * sqrt(9)       → 15 * 3 = 45

🔹 Percentage:
- /calc 10% of 200       → 20

⚠️ Note: Use valid math expressions. If there's an error, check your format.
      `
    }
  },

  onStart: async function ({ message, event, args }) {
    const input = args.join(" ");

    if (!input) {
      return message.reply("📌 Please provide a math expression.\nType /calc help to see usage examples.");
    }

    try {
      const result = math.evaluate(input);
      message.reply(`🧮 Result: ${result}`);
    } catch (error) {
      message.reply("⚠️ Invalid expression! Please try again with a correct math format.\nUse /calc help for usage.");
    }
  }
};
