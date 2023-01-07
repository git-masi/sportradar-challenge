import { PrismaClient } from '@prisma/client';
import { ScheduleService } from './schedule/index.js';

export type AppConfig = {
  prisma: PrismaClient;
  url: string;
};

export const appConfig: AppConfig = Object.freeze({
  prisma: new PrismaClient(),
  url: 'https://statsapi.web.nhl.com/api/v1',
});

ScheduleService(appConfig);
