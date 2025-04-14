import TelegramBot from "node-telegram-bot-api";
import invariant from "tiny-invariant";
import { RippleDb } from "./src/rippledb";

const db = new RippleDb()

const handleNegativeReaction = async (messageId: number): Promise<number> => {
  console.log(`Negative reaction on message ${messageId}`)
  const newValue = await handleReaction(messageId, -1)
  console.log(`New value is ${newValue}`)
  return newValue
}

const handlePositiveReaction = async (messageId: number): Promise<number> => {
  console.log(`Positive reaction on message ${messageId}`)
  const newValue = await handleReaction(messageId, 1)
  console.log(`New value is ${newValue}`)
  return newValue
}

const handleReaction = async (messageId: number, delta: number): Promise<number> => {
  const key = String(messageId)
  const oldValue = Number(await db.get(key) || 0)
  const newValue = oldValue + delta
  await db.set(key, newValue)
  return newValue
}

const main = async () => {
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

  bot.on("message_reaction", async (msg) => {
    if (msg.chat.id !== -4651840946) return

    console.log('MSG:', msg)
    const messageId = msg.message_id;
    const newReactions = msg.new_reaction;
    const oldReactions = msg.old_reaction;
    const diff = newReactions.filter(reaction => !oldReactions.some(oldReaction => oldReaction.emoji === reaction.emoji))
    console.log('Diff:', diff)
    for (const reaction of diff) {
      if (reaction.type === 'emoji' && ['💩', '👎'].includes(reaction.emoji)) {
        const result = await handleNegativeReaction(messageId);
        if (result <= -3) {
          console.log('Removing message', messageId)
          await bot.deleteMessage(msg.chat.id, messageId)
          await bot.sendMessage(msg.chat.id, `Баяны постишь, @${msg.user.username}, удалил я твоё сообщение`)
        }
      } else {
        handlePositiveReaction(messageId);
      }
    }
  });
};

main();
