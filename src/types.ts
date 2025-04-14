export type User = {
  first_name?: string;
  last_name?: string;
  username?: string;
  id: number;
}

export type Chat = {
  id: number;
  title?: string;
}

export type Message = {
  chat: Chat;
  date: number;
  message_id: number;
  from?: User;
  user?: User;
}

export type Reaction = {
  type: string;
  emoji: string;
}

export type ReactionMessage = Message & {
  old_reaction: Reaction[];
  new_reaction: Reaction[];
}