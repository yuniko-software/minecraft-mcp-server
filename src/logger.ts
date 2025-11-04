export function log(level: string, message: string): void {
  const timestamp = new Date().toISOString();
  process.stderr.write(`${timestamp} [minecraft] [mcp-server] [${level}] ${message}\n`);
}