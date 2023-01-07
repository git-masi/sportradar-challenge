import { Context } from '../index.js';
import { JobManager } from '../utils/jobs.js';
import { updateNhlSchedule } from './nhl.js';

export async function StartScheduleService(ctx: Context) {
  const jobRequests = [
    {
      name: 'NHL Schedule',
      cron: '0 0 0 * * *', // run once per day at midnight UTC
      fn: wrapper(updateNhlSchedule, ctx),
    },
  ];
  const manager = JobManager(ctx.logger.info);

  jobRequests.forEach((req) => manager.register(req));
}

function wrapper(fn: Function, ctx: Context) {
  return async () => {
    try {
      await fn(ctx);
    } catch (error) {
      ctx.logger.error(error);
    }
  };
}
