/**
 * Simple logger utility to replace console.log in production-ready code.
 * Ensures consistent logging schema horizontally across the application.
 */
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  error: (message: string, error?: unknown) => {
    // Force log errors regardless of environment, potentially hooked to APM
    console.error(`[ERROR] ${message}`, error instanceof Error ? error.message : error);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
};
