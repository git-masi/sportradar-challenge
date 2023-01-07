import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import { ScheduleService } from './schedule/index.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export type Context = {
  prisma: PrismaClient;
  logger: winston.Logger;
};

export const ctx: Context = Object.freeze({
  prisma: new PrismaClient(),
  logger,
});

ScheduleService(ctx);
