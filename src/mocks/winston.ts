import { vi } from 'vitest';
import { Logger } from 'winston';

vi.mock('winston');

const winstonMock = {
  transports: {
    Console: vi.fn(),
  },
  createLogger: vi.fn(() => ({
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    await: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    add: vi.fn(),
  })),
};

export const mockLogger = winstonMock.createLogger() as unknown as Logger;
