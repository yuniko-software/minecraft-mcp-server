import test from 'ava';
import { parseConfig } from '../src/config.js';

test('parseConfig returns default values', (t) => {
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js'];
  
  const config = parseConfig();
  
  t.is(config.host, 'localhost');
  t.is(config.port, 25565);
  t.is(config.username, 'LLMBot');
  
  process.argv = originalArgv;
});

test('parseConfig parses custom host', (t) => {
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js', '--host', 'example.com'];
  
  const config = parseConfig();
  
  t.is(config.host, 'example.com');
  t.is(config.port, 25565);
  t.is(config.username, 'LLMBot');
  
  process.argv = originalArgv;
});

test('parseConfig parses custom port', (t) => {
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js', '--port', '12345'];
  
  const config = parseConfig();
  
  t.is(config.host, 'localhost');
  t.is(config.port, 12345);
  t.is(config.username, 'LLMBot');
  
  process.argv = originalArgv;
});

test('parseConfig parses custom username', (t) => {
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js', '--username', 'CustomBot'];
  
  const config = parseConfig();
  
  t.is(config.host, 'localhost');
  t.is(config.port, 25565);
  t.is(config.username, 'CustomBot');
  
  process.argv = originalArgv;
});

test('parseConfig parses all custom options', (t) => {
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js', '--host', 'server.net', '--port', '9999', '--username', 'TestBot'];
  
  const config = parseConfig();
  
  t.is(config.host, 'server.net');
  t.is(config.port, 9999);
  t.is(config.username, 'TestBot');
  
  process.argv = originalArgv;
});

test('parseConfig handles numeric port as number type', (t) => {
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js', '--port', '30000'];
  
  const config = parseConfig();
  
  t.is(typeof config.port, 'number');
  t.is(config.port, 30000);
  
  process.argv = originalArgv;
});
