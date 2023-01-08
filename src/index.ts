import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import { StartPlayersService } from './players/index.js';
import { StartScheduleService } from './schedule/index.js';
import { StartTeamsService } from './teams/index.js';

// Additional configuration can be added for Datadog or other
// services in the future
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

// StartTeamsService(ctx);
// StartScheduleService(ctx);
// StartPlayersService(ctx);

export function errorLogger(fn: Function, ctx: Context) {
  return async () => {
    try {
      await fn(ctx);
    } catch (error) {
      ctx.logger.error(error);
    }
  };
}
