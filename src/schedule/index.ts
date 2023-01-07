import { initNhlJob } from './hhl.js';
import { AppConfig } from '../index.js';
import { JobManager } from '../utils/jobs.js';

export async function ScheduleService(appConfig: AppConfig) {
  const jobRequests = await Promise.all([initNhlJob(appConfig)]);
  const manager = JobManager(appConfig.prisma);
  jobRequests.forEach((r) => manager.register(r));
}
