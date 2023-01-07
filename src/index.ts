import { PrismaClient } from '@prisma/client';
import { ScheduleService } from './schedule/index.js';

export type AppConfig = {
  prisma: PrismaClient;
};

export const appConfig: AppConfig = Object.freeze({
  prisma: new PrismaClient(),
});

ScheduleService(appConfig);
