import test from 'ava';
import { log } from '../src/logger.js';

test('log writes to stderr', (t) => {
  const originalWrite = process.stderr.write;
  let capturedOutput = '';
  
  process.stderr.write = ((chunk: string | Uint8Array) => {
    capturedOutput += chunk.toString();
    return true;
  }) as typeof process.stderr.write;
  
  log('info', 'Test message');
  
  t.true(capturedOutput.length > 0);
  t.true(capturedOutput.includes('Test message'));
  
  process.stderr.write = originalWrite;
});

test('log format includes all required components', (t) => {
  const originalWrite = process.stderr.write;
  let capturedOutput = '';
  
  process.stderr.write = ((chunk: string | Uint8Array) => {
    capturedOutput += chunk.toString();
    return true;
  }) as typeof process.stderr.write;
  
  log('error', 'Connection failed');
  
  t.true(capturedOutput.includes('[minecraft]'));
  t.true(capturedOutput.includes('[mcp-server]'));
  t.true(capturedOutput.includes('[error]'));
  t.true(capturedOutput.includes('Connection failed'));
  t.true(capturedOutput.endsWith('\n'));
  
  process.stderr.write = originalWrite;
});

test('log includes ISO timestamp', (t) => {
  const originalWrite = process.stderr.write;
  let capturedOutput = '';
  
  process.stderr.write = ((chunk: string | Uint8Array) => {
    capturedOutput += chunk.toString();
    return true;
  }) as typeof process.stderr.write;
  
  const beforeTime = new Date().toISOString();
  log('info', 'Timing test');
  const afterTime = new Date().toISOString();
  
  const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
  t.true(timestampRegex.test(capturedOutput));
  
  const timestamp = capturedOutput.match(timestampRegex)?.[0];
  t.true(timestamp !== undefined);
  t.true(timestamp! >= beforeTime.substring(0, 19));
  t.true(timestamp! <= afterTime);
  
  process.stderr.write = originalWrite;
});

test('log handles different log levels', (t) => {
  const originalWrite = process.stderr.write;
  const outputs: string[] = [];
  
  process.stderr.write = ((chunk: string | Uint8Array) => {
    outputs.push(chunk.toString());
    return true;
  }) as typeof process.stderr.write;
  
  log('info', 'Info message');
  log('warn', 'Warning message');
  log('error', 'Error message');
  log('debug', 'Debug message');
  
  t.is(outputs.length, 4);
  t.true(outputs[0].includes('[info]'));
  t.true(outputs[1].includes('[warn]'));
  t.true(outputs[2].includes('[error]'));
  t.true(outputs[3].includes('[debug]'));
  
  process.stderr.write = originalWrite;
});

test('log handles empty message', (t) => {
  const originalWrite = process.stderr.write;
  let capturedOutput = '';
  
  process.stderr.write = ((chunk: string | Uint8Array) => {
    capturedOutput += chunk.toString();
    return true;
  }) as typeof process.stderr.write;
  
  log('info', '');
  
  t.true(capturedOutput.includes('[minecraft]'));
  t.true(capturedOutput.includes('[info]'));
  t.true(capturedOutput.endsWith(' \n'));
  
  process.stderr.write = originalWrite;
});

test('log handles special characters in message', (t) => {
  const originalWrite = process.stderr.write;
  let capturedOutput = '';
  
  process.stderr.write = ((chunk: string | Uint8Array) => {
    capturedOutput += chunk.toString();
    return true;
  }) as typeof process.stderr.write;
  
  const specialMessage = 'Error: {json: "value"} & <tag> "quotes" \'apostrophes\'';
  log('error', specialMessage);
  
  t.true(capturedOutput.includes(specialMessage));
  t.true(capturedOutput.includes('{json: "value"}'));
  t.true(capturedOutput.includes('<tag>'));
  
  process.stderr.write = originalWrite;
});

test('log handles multiline message', (t) => {
  const originalWrite = process.stderr.write;
  let capturedOutput = '';
  
  process.stderr.write = ((chunk: string | Uint8Array) => {
    capturedOutput += chunk.toString();
    return true;
  }) as typeof process.stderr.write;
  
  const multilineMessage = 'Line 1\nLine 2\nLine 3';
  log('info', multilineMessage);
  
  t.true(capturedOutput.includes(multilineMessage));
  t.true(capturedOutput.includes('Line 1\nLine 2\nLine 3'));
  
  process.stderr.write = originalWrite;
});

test('log output format is consistent', (t) => {
  const originalWrite = process.stderr.write;
  let capturedOutput = '';
  
  process.stderr.write = ((chunk: string | Uint8Array) => {
    capturedOutput += chunk.toString();
    return true;
  }) as typeof process.stderr.write;
  
  log('info', 'Test');
  
  const expectedPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[minecraft\] \[mcp-server\] \[info\] Test\n$/;
  t.true(expectedPattern.test(capturedOutput));
  
  process.stderr.write = originalWrite;
});
