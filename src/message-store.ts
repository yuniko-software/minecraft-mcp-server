interface StoredMessage {
  timestamp: number;
  username: string;
  content: string;
}

const MAX_STORED_MESSAGES = 100;

export class MessageStore {
  private messages: StoredMessage[] = [];
  private maxMessages = MAX_STORED_MESSAGES;

  addMessage(username: string, content: string): void {
    const message: StoredMessage = {
      timestamp: Date.now(),
      username,
      content
    };

    this.messages.push(message);

    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  getRecentMessages(count: number = 10): StoredMessage[] {
    return this.messages.slice(-count);
  }

  getMaxMessages(): number {
    return this.maxMessages;
  }
}
