import { Context, errorLogger } from '../index.js';
import { JobManager } from '../utils/jobs.js';
import { updateNhlPlayers } from './nhl.js';

export async function StartPlayersService(ctx: Context) {
  const jobRequests = [
    {
      name: 'NHL Players',
      cron: '0 0 1 * * *', // run once per day at 1am UTC
      fn: errorLogger(updateNhlPlayers, ctx),
    },
  ];
  const manager = JobManager(ctx.logger.info);

  jobRequests.forEach((req) => manager.register(req));
}