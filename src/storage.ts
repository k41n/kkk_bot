import { DatabaseSync, StatementSync } from "node:sqlite";
import path from "path";
import { Message, ReactionMessage } from "./types";
import TelegramBot from "node-telegram-bot-api";

const filename = path.resolve(__dirname, "../botdb");
console.log(`Using ${filename} for storage`);
const database = new DatabaseSync(filename);

const NEGATIVE_EMOJI = ["👎", "💩"];

const initDatabase = () => {
  const initQuery = `
    CREATE TABLE IF NOT EXISTS users (
      nickname TEXT,
      user_id INTEGER PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS messages (
      message_id INTEGER PRIMARY KEY,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reactions (
      emoji TEXT,
      message_id INTEGER,
      user_id INTEGER,
      FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
  `;

  database.exec(initQuery);
};

initDatabase();

export class BotStore {
  #addMessage: StatementSync;
  #addReaction: StatementSync;
  #addUser: StatementSync;
  #bot: TelegramBot;
  #getEmotions: StatementSync;
  #getMessage: StatementSync;
  #getUser: StatementSync;
  #clearUserReactionsOnMessage: StatementSync;

  constructor(bot: TelegramBot) {
    this.#bot = bot;
    this.#clearUserReactionsOnMessage = database.prepare(`
      DELETE FROM reactions
      WHERE user_id = ?
      AND message_id = ?
    `);

    this.#addUser = database.prepare(`
      INSERT INTO
      users (user_id, nickname) 
      VALUES
      (
        ?,
        ?
      )
      ON CONFLICT (user_id) DO NOTHING
    `);

    this.#addMessage = database.prepare(`
      INSERT INTO
      messages (user_id, message_id) 
      VALUES
      (
        ?,
        ?
      )
      ON CONFLICT (message_id) DO NOTHING
    `);

    this.#addReaction = database.prepare(`
      INSERT INTO
      reactions (user_id, message_id, emoji) 
      VALUES
      (
        ?,
        ?,
        ?
      )
    `);

    this.#getEmotions = database.prepare(`
      SELECT emoji FROM reactions WHERE message_id = ?
    `);

    this.#getMessage = database.prepare(`
      SELECT * FROM messages WHERE message_id = ?
    `)

    this.#getUser = database.prepare(`
      SELECT * FROM users WHERE user_id = ?
    `)
  }

  public async handleMessage(msg: Message) {
    console.log("handleMessage", msg, msg.from?.username);
    await this.#addUser.run(Number(msg.from?.id), msg.from?.username);
    console.log(this.#addUser.expandedSQL);
    await this.#addMessage.run(Number(msg.from?.id), Number(msg.message_id));
  }

  public async handleReaction(msg: ReactionMessage) {
    try {
      await this.#addUser.run(Number(msg.user?.id), msg.user.username)
      await this.#clearUserReactionsOnMessage.run(
        Number(msg.user?.id),
        Number(msg.message_id)
      );
      for (const reaction of msg.new_reaction) {
        await this.#addReaction.run(
          Number(msg.user?.id),
          Number(msg.message_id),
          reaction.emoji
        );
      }
      console.log("handleReactionMessage", msg);
      await this.checkThreshold(msg.chat.id, msg.message_id);
    } catch (e: unknown) {
      console.error(e);
    }
  }

  private async checkThreshold(chatId: number, messageId: number): Promise<void> {
    const reactions = this.#getEmotions.all(messageId);
    const sum = reactions.reduce(
      (sum, reaction) =>
        sum + (NEGATIVE_EMOJI.includes(String(reaction.emoji)) ? -1 : 1),
      0
    );

    console.log(`Sum for message ${messageId} is ${sum}`)
    const message = this.#getMessage.get(messageId);
    console.log('Message from db', message)
    const user = this.#getUser.get(message.user_id)
    console.log('User from db', user)
    if (sum <= Number(process.env.THRESHOLD)) {
      this.#bot.deleteMessage(chatId, messageId)
      this.#bot.sendMessage(chatId, `Баяны постишь, @${user.nickname}, удалил я твоё сообщение`)
    }
  }
}
