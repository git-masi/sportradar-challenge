import { Context } from '../index.js';
import { JobManager } from '../utils/jobs.js';
import { createUpdateNhlTeamsConfig, updateNhlTeams } from './nhl.js';

export async function startTeamsService(ctx: Context) {
  const jobRequests = [
    {
      name: 'NHL Teams',
      cron: '0 30 0 * * *', // run once per day at 12:30am UTC
      fn: () => updateNhlTeams(createUpdateNhlTeamsConfig(ctx)),
      invokeImmediately: false,
    },
  ];
  const manager = JobManager(ctx.logger.info, ctx.logger.error);

  jobRequests.forEach((req) => manager.register(req));
}
