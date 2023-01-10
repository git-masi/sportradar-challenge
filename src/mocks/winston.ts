import { Logger } from 'winston';

const winston = jest.mock('winston');

const winstonMock = {
  ...winston,
  transports: {
    Console: jest.fn(),
  },
  createLogger: jest.fn(() => ({
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    await: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    add: jest.fn(),
  })),
};

export const mockLogger = winstonMock.createLogger() as unknown as Logger;
