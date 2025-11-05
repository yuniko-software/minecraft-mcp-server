import test from 'ava';
import { MessageStore } from '../src/message-store.js';

test('adds and retrieves messages', (t) => {
  const store = new MessageStore();
  
  store.addMessage('player1', 'Hello world');
  store.addMessage('player2', 'Hi there');
  
  const messages = store.getRecentMessages(10);
  
  t.is(messages.length, 2);
  t.is(messages[0].username, 'player1');
  t.is(messages[0].content, 'Hello world');
  t.is(messages[1].username, 'player2');
  t.is(messages[1].content, 'Hi there');
  t.true(typeof messages[0].timestamp === 'number');
  t.true(typeof messages[1].timestamp === 'number');
});

test('limits messages to maximum of 100', (t) => {
  const store = new MessageStore();
  
  for (let i = 0; i < 150; i++) {
    store.addMessage(`player${i}`, `Message ${i}`);
  }
  
  const allMessages = store.getRecentMessages(200);
  
  t.is(allMessages.length, 100);
  t.is(allMessages[0].content, 'Message 50');
  t.is(allMessages[99].content, 'Message 149');
});

test('getRecentMessages returns limited count', (t) => {
  const store = new MessageStore();
  
  for (let i = 0; i < 20; i++) {
    store.addMessage('player', `Message ${i}`);
  }
  
  const messages = store.getRecentMessages(5);
  
  t.is(messages.length, 5);
  t.is(messages[0].content, 'Message 15');
  t.is(messages[4].content, 'Message 19');
});

test('returns empty array when no messages', (t) => {
  const store = new MessageStore();
  
  const messages = store.getRecentMessages(10);
  
  t.is(messages.length, 0);
  t.deepEqual(messages, []);
});

test('getRecentMessages defaults to 10 messages', (t) => {
  const store = new MessageStore();
  
  for (let i = 0; i < 20; i++) {
    store.addMessage('player', `Message ${i}`);
  }
  
  const messages = store.getRecentMessages();
  
  t.is(messages.length, 10);
  t.is(messages[0].content, 'Message 10');
  t.is(messages[9].content, 'Message 19');
});

test('getRecentMessages with count larger than stored messages', (t) => {
  const store = new MessageStore();
  
  store.addMessage('player1', 'Message 1');
  store.addMessage('player2', 'Message 2');
  
  const messages = store.getRecentMessages(50);
  
  t.is(messages.length, 2);
});

test('getMaxMessages returns 100', (t) => {
  const store = new MessageStore();
  
  t.is(store.getMaxMessages(), 100);
});

test('messages have increasing timestamps', (t) => {
  const store = new MessageStore();
  
  store.addMessage('player1', 'First');
  store.addMessage('player2', 'Second');
  
  const messages = store.getRecentMessages(2);
  
  t.true(messages[1].timestamp >= messages[0].timestamp);
});

test('handles empty username and content', (t) => {
  const store = new MessageStore();
  
  store.addMessage('', '');
  
  const messages = store.getRecentMessages(1);
  
  t.is(messages.length, 1);
  t.is(messages[0].username, '');
  t.is(messages[0].content, '');
});

test('getRecentMessages with zero count', (t) => {
  const store = new MessageStore();
  
  store.addMessage('player', 'Message');
  
  const messages = store.getRecentMessages(0);
  
  t.is(messages.length, 0);
});
