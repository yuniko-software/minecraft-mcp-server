import test from 'ava';
import sinon from 'sinon';
import { BotConnection } from '../src/bot-connection.js';

test('constructor initializes with correct state', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  t.is(connection.getState(), 'connecting');
  t.deepEqual(connection.getConfig(), config);
  t.is(connection.getBot(), null);
  t.false(connection.isConnected());
});

test('constructor accepts custom reconnect delay', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const customDelay = 5000;
  const connection = new BotConnection(config, callbacks, customDelay);

  t.is(connection.getState(), 'connecting');
});

test('getState returns current state', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  t.is(connection.getState(), 'connecting');
});

test('getConfig returns configuration', (t) => {
  const config = { host: 'example.com', port: 30000, username: 'MyBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  const returnedConfig = connection.getConfig();
  t.is(returnedConfig.host, 'example.com');
  t.is(returnedConfig.port, 30000);
  t.is(returnedConfig.username, 'MyBot');
});

test('getBot returns null initially', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  t.is(connection.getBot(), null);
});

test('isConnected returns false when state is connecting', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  t.false(connection.isConnected());
});

test('formatError handles Error objects', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  const error = new Error('Test error');
  const formatted = (connection as any).formatError(error);

  t.is(formatted, 'Test error');
});

test('formatError handles plain objects', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  const errorObj = { code: 'ECONNREFUSED', message: 'Connection refused' };
  const formatted = (connection as any).formatError(errorObj);

  t.true(formatted.includes('ECONNREFUSED'));
  t.true(formatted.includes('Connection refused'));
});

test('formatError handles strings', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  const formatted = (connection as any).formatError('Simple error');

  t.is(formatted, '"Simple error"');
});

test('formatError handles non-serializable objects', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  const circular: any = {};
  circular.self = circular;
  const formatted = (connection as any).formatError(circular);

  t.is(typeof formatted, 'string');
});

test('checkConnectionAndReconnect returns connected when already connected', async (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);
  
  (connection as any).state = 'connected';

  const result = await connection.checkConnectionAndReconnect();

  t.true(result.connected);
  t.is(result.message, undefined);
});

test('checkConnectionAndReconnect returns message when connecting', async (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  const result = await connection.checkConnectionAndReconnect();

  t.false(result.connected);
  t.true(result.message!.includes('connecting'));
});

test('checkConnectionAndReconnect includes setup instructions on failure', async (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks, 100);

  (connection as any).state = 'disconnected';

  // Stub attemptReconnect to prevent actual connection attempt
  const attemptReconnectStub = sinon.stub(connection as any, 'attemptReconnect').callsFake(() => {
    (connection as any).state = 'connecting';
  });

  const result = await connection.checkConnectionAndReconnect();

  t.true(attemptReconnectStub.calledOnce);
  t.false(result.connected);
  t.true(result.message!.includes('Cannot connect'));
  t.true(result.message!.includes('localhost:25565'));
  t.true(result.message!.includes('github.com'));

  attemptReconnectStub.restore();
});

test('cleanup clears reconnect timer', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  (connection as any).reconnectTimer = setTimeout(() => {}, 10000);

  t.notThrows(() => {
    connection.cleanup();
  });
});

test('cleanup does not throw when no bot exists', (t) => {
  const config = { host: 'localhost', port: 25565, username: 'TestBot' };
  const callbacks = { onLog: sinon.stub(), onChatMessage: sinon.stub() };
  const connection = new BotConnection(config, callbacks);

  t.notThrows(() => {
    connection.cleanup();
  });
});
