import { Context } from '../index.js';
import { JobManager } from '../utils/jobs.js';
import { updateNhlSchedule } from './nhl.js';

export async function startScheduleService(ctx: Context) {
  const jobRequests = [
    {
      name: 'NHL Schedule',
      cron: '0 0 0 * * *', // run once per day at midnight UTC
      fn: () => updateNhlSchedule(ctx),
      invokeImmediately: false,
    },
  ];
  const manager = JobManager(ctx.logger.info, ctx.logger.error);

  jobRequests.forEach((req) => manager.register(req));
}
