import { initNhlJob } from './hhl.js';
import { Context } from '../index.js';
import { JobManager } from '../utils/jobs.js';

export async function ScheduleService(ctx: Context) {
  const jobRequests = await Promise.all([initNhlJob(ctx)]);
  const manager = JobManager();
  jobRequests.forEach((req) => manager.register(req));
}
