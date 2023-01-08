import { Context, errorLogger } from '../index.js';
import { JobManager } from '../utils/jobs.js';
import { updateNhlStats } from './nhl.js';

export async function startStatsService(ctx: Context) {
  const jobRequests = [
    {
      name: 'NHL Stats',
      cron: '0 0 2 * * *', // run once per day at 2am UTC
      fn: errorLogger(updateNhlStats, ctx),
    },
  ];
  const manager = JobManager(ctx.logger.info);

  jobRequests.forEach((req) => manager.register(req));
}
