import { Context, errorLogger } from '../index.js';
import { JobManager } from '../utils/jobs.js';
// import { updateNhlPlayers } from './nhl.js';

export async function StartTeamsService(ctx: Context) {
  const jobRequests = [
    {
      name: 'NHL Teams',
      cron: '0 30 0 * * *', // run once per day at 12:30am UTC
      fn: errorLogger(() => {}, ctx),
    },
  ];
  const manager = JobManager(ctx.logger.info);

  jobRequests.forEach((req) => manager.register(req));
}
