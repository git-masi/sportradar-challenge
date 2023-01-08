import { Context } from '../index.js';
import { JobManager } from '../utils/jobs.js';
import { updateNhlPlayers } from './nhl.js';

export async function StartPlayersService(ctx: Context) {
  const jobRequests = [
    {
      name: 'NHL Players',
      // cron: '0 1 0 * * *', // run once per day at 1am UTC
      cron: '*/10 * * * * *',
      fn: wrapper(updateNhlPlayers, ctx),
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
