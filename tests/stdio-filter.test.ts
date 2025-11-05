import test from 'ava';
import { setupStdioFiltering } from '../src/stdio-filter.js';

test('allows JSON messages to pass through', (t) => {
  const originalWrite = process.stdout.write;
  let capturedOutput = '';
  
  process.stdout.write = ((chunk: any) => {
    capturedOutput += chunk.toString();
    return true;
  }) as any;
  
  setupStdioFiltering();
  
  const jsonMessage = '{"jsonrpc":"2.0","id":1,"method":"test"}';
  process.stdout.write(jsonMessage);
  
  t.is(capturedOutput, jsonMessage);
  
  process.stdout.write = originalWrite;
});

test('allows timestamp log messages to pass through', (t) => {
  const originalWrite = process.stdout.write;
  let capturedOutput = '';
  
  process.stdout.write = ((chunk: any) => {
    capturedOutput += chunk.toString();
    return true;
  }) as any;
  
  setupStdioFiltering();
  
  const logMessage = '2025-11-05T19:45:29.842Z [minecraft] [mcp-server] [info] Bot connected\n';
  process.stdout.write(logMessage);
  
  t.is(capturedOutput, logMessage);
  
  process.stdout.write = originalWrite;
});

test('allows newline-only messages to pass through', (t) => {
  const originalWrite = process.stdout.write;
  let capturedOutput = '';
  
  process.stdout.write = ((chunk: any) => {
    capturedOutput += chunk.toString();
    return true;
  }) as any;
  
  setupStdioFiltering();
  
  process.stdout.write('\n');
  process.stdout.write('\r\n');
  
  t.is(capturedOutput, '\n\r\n');
  
  process.stdout.write = originalWrite;
});

test('filters out random debug messages', (t) => {
  const originalWrite = process.stdout.write;
  let capturedOutput = '';
  
  process.stdout.write = ((chunk: any) => {
    capturedOutput += chunk.toString();
    return true;
  }) as any;
  
  setupStdioFiltering();
  
  process.stdout.write('Minecraft bot debug message');
  process.stdout.write('Some random output');
  
  t.is(capturedOutput, '');
  
  process.stdout.write = originalWrite;
});

test('filters minecraft-protodef library output', (t) => {
  const originalWrite = process.stdout.write;
  let capturedOutput = '';
  
  process.stdout.write = ((chunk: any) => {
    capturedOutput += chunk.toString();
    return true;
  }) as any;
  
  setupStdioFiltering();
  
  process.stdout.write('Loading minecraft protocol version 1.20.4');
  process.stdout.write('[protodef] Packet received');
  
  t.is(capturedOutput, '');
  
  process.stdout.write = originalWrite;
});

test('allows JSON while filtering other messages', (t) => {
  const originalWrite = process.stdout.write;
  let capturedOutput = '';
  
  process.stdout.write = ((chunk: any) => {
    capturedOutput += chunk.toString();
    return true;
  }) as any;
  
  setupStdioFiltering();
  
  process.stdout.write('Random message');
  process.stdout.write('{"jsonrpc":"2.0","result":"success"}');
  process.stdout.write('More random output');
  
  t.is(capturedOutput, '{"jsonrpc":"2.0","result":"success"}');
  
  process.stdout.write = originalWrite;
});

test('suppresses console.error output', (t) => {
  setupStdioFiltering();
  
  t.notThrows(() => {
    console.error('This should be suppressed');
    console.error('No errors thrown');
  });
});

test('console.error becomes a no-op function', (t) => {
  const originalError = console.error;
  
  setupStdioFiltering();
  
  const result = console.error('test');
  
  t.is(result, undefined);
  
  console.error = originalError;
});
