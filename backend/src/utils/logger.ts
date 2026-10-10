export const logger = {
  info: (_msg: string, ..._args: any[]) => {},
  warn: (_msg: string, ..._args: any[]) => {},
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
  debug: (_msg: string, ..._args: any[]) => {},
};
