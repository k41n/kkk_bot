import { Database } from "rippledb";
import path from 'path';

export class RippleDb {
  #db: Database;
  #decoder: TextDecoder

  constructor() {
    this.#db = new Database(path.resolve(__dirname, '../db'))
    this.#decoder = new TextDecoder()
  }

  public async get(key: string): Promise<string> {
    const result = await this.#db.get(key)
    if (!result) return null;

    return JSON.parse(this.#decoder.decode(result))
  }

  public async set(key: string, value: string | number) {
    this.#db.put(key, String(value))
  }
}