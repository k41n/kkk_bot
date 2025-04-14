import TelegramBot from "node-telegram-bot-api";
import invariant from "tiny-invariant";
import { BotStore } from "./src/storage";


const main = async () => {
  console.log("Starting...");
  invariant(process.env.API_KEY_BOT, "API_KEY_BOT not set");
  const bot = new TelegramBot(process.env.API_KEY_BOT, {
    polling: {
      interval: 300,
      params: {
        allowed_updates: [
          "message",
          "message_reaction",
          "message_reaction_count",
        ],
        timeout: 10,
      },
    },
  });
  const storage = new BotStore(bot);

  bot.on("message", (msg) => storage.handleMessage(msg));
  bot.on("message_reaction", (msg) => storage.handleReaction(msg));
  //   console.log('MSG:', msg)
  //   const messageId = msg.message_id;
  //   const newReactions = msg.new_reaction;
  //   const oldReactions = msg.old_reaction;
  //   const diff = newReactions.filter(reaction => !oldReactions.some(oldReaction => oldReaction.emoji === reaction.emoji))
  //   console.log('Diff:', diff)
  //   for (const reaction of diff) {
  //     if (reaction.type === 'emoji' && ['💩', '👎'].includes(reaction.emoji)) {
  //       const result = await handleNegativeReaction(messageId);
  //       if (result <= -3) {
  //         console.log('Removing message', messageId)
  //         await bot.deleteMessage(msg.chat.id, messageId)
  //         await bot.sendMessage(msg.chat.id, `Баяны постишь, @${msg.user.username}, удалил я твоё сообщение`)
  //       }
  //     } else {
  //       handlePositiveReaction(messageId);
  //     }
  //   }
  // });
  console.log("Started.");
};

main();
