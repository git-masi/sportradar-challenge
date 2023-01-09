import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import { startPlayersService } from './players/index.js';
import { updateNhlPlayers } from './players/nhl.js';
import { startScheduleService } from './schedule/index.js';
import { updateNhlSchedule } from './schedule/nhl.js';
import { startStatsService } from './stats/index.js';
import { startTeamsService } from './teams/index.js';
import { updateNhlTeams } from './teams/nhl.js';

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

(async () => {
  // Some database tables have foreign key constraints so we need to init
  // some values before starting any services
  logger.info('Initializing required data');
  await updateNhlTeams(ctx);
  await updateNhlPlayers(ctx);
  await updateNhlSchedule(ctx);

  logger.info('Starting individual services');
  await Promise.all([
    startTeamsService(ctx),
    startScheduleService(ctx),
    startPlayersService(ctx),
    startStatsService(ctx),
  ]);
})();
