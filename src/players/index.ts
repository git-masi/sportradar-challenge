import { Context } from '../index.js';
import { JobManager } from '../utils/jobs.js';
import { createUpdateNhlPlayersConfig, updateNhlPlayers } from './nhl.js';

export async function startPlayersService(ctx: Context) {
  const jobRequests = [
    {
      name: 'NHL Players',
      cron: '0 0 1 * * *', // run once per day at 1am UTC
      fn: () => updateNhlPlayers(createUpdateNhlPlayersConfig(ctx)),
      invokeImmediately: false,
    },
  ];
  const manager = JobManager(ctx.logger.info, ctx.logger.info);

  jobRequests.forEach((req) => manager.register(req));
}
