import { Context, errorLogger } from '../index.js';
import { JobManager } from '../utils/jobs.js';
import { updateNhlTeams } from './nhl.js';

export async function StartTeamsService(ctx: Context) {
  const jobRequests = [
    {
      name: 'NHL Teams',
      cron: '0 30 0 * * *', // run once per day at 12:30am UTC
      fn: errorLogger(updateNhlTeams, ctx),
    },
  ];
  const manager = JobManager(ctx.logger.info);

  jobRequests.forEach((req) => manager.register(req));
}
