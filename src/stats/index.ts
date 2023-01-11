import { Context } from '../index.js';
import { JobManager } from '../utils/jobs.js';
import { getScheduledGames, updateNhlStats } from './nhl.js';

export async function startStatsService(ctx: Context) {
  const manager = JobManager(ctx.logger.info, ctx.logger.error);
  const jobRequests = [
    {
      name: 'NHL Stats',
      cron: '0 0 2 * * *', // run once per day at 2am UTC
      fn: () =>
        updateNhlStats(ctx, manager.register, getScheduledGames(ctx.prisma)),
    },
  ];

  jobRequests.forEach((req) => manager.register(req));
}
