import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import { startPlayersService } from './players/index.js';
import { startScheduleService } from './schedule/index.js';
import { startStatsService } from './stats/index.js';
import { startTeamsService } from './teams/index.js';

// Additional configuration can be added for Datadog or other
// services in the future
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'data-ingestion-service' },
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

// startTeamsService(ctx);
// startScheduleService(ctx);
// startPlayersService(ctx);
// startStatsService(ctx);
