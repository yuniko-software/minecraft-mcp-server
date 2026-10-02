import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';

const port = Number(process.argv[2] ?? 25565);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Pass a LAN port between 1 and 65535');
}

const client = new Client({ name: 'minecraft-compatibility-test', version: '1.0.0' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [
    fileURLToPath(new URL('../dist/main.js', import.meta.url)),
    '--host', '127.0.0.1',
    '--port', String(port),
    '--username', 'MCPSmokeTest'
  ],
  stderr: 'pipe'
});

function responseText(result) {
  return result.content
    .filter(item => item.type === 'text')
    .map(item => item.text)
    .join('\n');
}

async function callTool(name, args = {}) {
  const result = await client.callTool(
    { name, arguments: args }, undefined, { timeout: 10000 }
  );
  if (result.isError) throw new Error(responseText(result));
  return responseText(result);
}

const timeout = setTimeout(() => {
  console.error('Live compatibility test timed out');
  client.close().finally(() => process.exit(1));
}, 45000);

try {
  await client.connect(transport);
  transport.stderr?.on('data', data => process.stderr.write(data));
  const { tools } = await client.listTools();
  console.log('MCP tools: ' + tools.length);

  let position;
  for (let attempt = 0; attempt < 25; attempt++) {
    const result = await client.callTool({ name: 'get-position', arguments: {} });
    const match = responseText(result).match(
      /Current position: \((-?\d+), (-?\d+), (-?\d+)\)/
    );
    if (!result.isError && match) {
      position = match.slice(1).map(Number);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!position) throw new Error('Bot did not spawn');
  console.log('Bot position: ' + position.join(', '));
  console.log(await callTool('detect-gamemode'));

  // Wait for the server's nearby chunks before checking block decoding.
  let block;
  for (let attempt = 0; attempt < 10; attempt++) {
    const [x, y, z] = position;
    block = await callTool('get-block-info', { x, y: y - 1, z });
    if (block.startsWith('Found ')) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!block?.startsWith('Found ')) throw new Error('Nearby block data was not loaded');
  console.log(block);
  console.log('Live MCP compatibility test passed');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  await client.close();
}
