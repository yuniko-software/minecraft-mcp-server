import test from 'ava';
import sinon from 'sinon';
import { registerChatTools } from '../src/tools/chat-tools.js';
import { ToolFactory } from '../src/tool-factory.js';
import { MessageStore } from '../src/message-store.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BotConnection } from '../src/bot-connection.js';

test('registerChatTools registers send-chat tool', (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as any;
  const getBot = () => mockBot;
  const messageStore = new MessageStore();

  registerChatTools(factory, getBot, messageStore);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const sendChatCall = toolCalls.find(call => call.args[0] === 'send-chat');

  t.truthy(sendChatCall);
  t.is(sendChatCall!.args[1], 'Send a chat message in-game');
});

test('registerChatTools registers read-chat tool', (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  const mockBot = {} as any;
  const getBot = () => mockBot;
  const messageStore = new MessageStore();

  registerChatTools(factory, getBot, messageStore);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const readChatCall = toolCalls.find(call => call.args[0] === 'read-chat');

  t.truthy(readChatCall);
  t.is(readChatCall!.args[1], 'Get recent chat messages from players');
});

test('send-chat calls bot.chat with message', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  
  const mockBot = {
    chat: sinon.stub()
  } as any;
  const getBot = () => mockBot;
  const messageStore = new MessageStore();

  registerChatTools(factory, getBot, messageStore);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const sendChatCall = toolCalls.find(call => call.args[0] === 'send-chat');
  const executor = sendChatCall!.args[3];

  const result = await executor({ message: 'Hello world' });

  t.true((mockBot.chat as sinon.SinonStub).calledOnceWith('Hello world'));
  t.true(result.content[0].text.includes('Hello world'));
});

test('read-chat returns no messages when empty', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  
  const mockBot = {} as any;
  const getBot = () => mockBot;
  const messageStore = new MessageStore();

  registerChatTools(factory, getBot, messageStore);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const readChatCall = toolCalls.find(call => call.args[0] === 'read-chat');
  const executor = readChatCall!.args[3];

  const result = await executor({});

  t.true(result.content[0].text.includes('No chat messages found'));
});

test('read-chat returns formatted messages', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  
  const mockBot = {} as any;
  const getBot = () => mockBot;
  const messageStore = new MessageStore();

  messageStore.addMessage('player1', 'Hello');
  messageStore.addMessage('player2', 'Hi there');

  registerChatTools(factory, getBot, messageStore);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const readChatCall = toolCalls.find(call => call.args[0] === 'read-chat');
  const executor = readChatCall!.args[3];

  const result = await executor({ count: 10 });

  t.true(result.content[0].text.includes('player1'));
  t.true(result.content[0].text.includes('Hello'));
  t.true(result.content[0].text.includes('player2'));
  t.true(result.content[0].text.includes('Hi there'));
  t.true(result.content[0].text.includes('2 chat message'));
});

test('read-chat respects count parameter', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  
  const mockBot = {} as any;
  const getBot = () => mockBot;
  const messageStore = new MessageStore();

  for (let i = 0; i < 20; i++) {
    messageStore.addMessage(`player${i}`, `Message ${i}`);
  }

  registerChatTools(factory, getBot, messageStore);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const readChatCall = toolCalls.find(call => call.args[0] === 'read-chat');
  const executor = readChatCall!.args[3];

  const result = await executor({ count: 5 });

  t.true(result.content[0].text.includes('5 chat message'));
});

test('read-chat limits count to max messages', async (t) => {
  const mockServer = {
    tool: sinon.stub()
  } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  const factory = new ToolFactory(mockServer, mockConnection);
  
  const mockBot = {} as any;
  const getBot = () => mockBot;
  const messageStore = new MessageStore();

  for (let i = 0; i < 10; i++) {
    messageStore.addMessage(`player${i}`, `Message ${i}`);
  }

  registerChatTools(factory, getBot, messageStore);

  const toolCalls = (mockServer.tool as sinon.SinonStub).getCalls();
  const readChatCall = toolCalls.find(call => call.args[0] === 'read-chat');
  const executor = readChatCall!.args[3];

  const result = await executor({ count: 200 });

  t.true(result.content[0].text.includes('10 chat message'));
});
