export function setupStdioFiltering(): void {
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  process.stdout.write = function(chunk: any, ...args: any[]): boolean {
    const message = chunk.toString();
    if (message.match(/^(\{|[\r\n]+$)/) || message.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return originalStdoutWrite(chunk, ...args);
    }
    return true;
  } as any;

  console.error = function() { return; };
}
