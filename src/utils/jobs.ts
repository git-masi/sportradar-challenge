import { CronJob } from 'cron';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

type JobFnParams = { jobId: string; prisma: PrismaClient; end: () => void };

type JobFn = (params: JobFnParams) => Promise<void>;

type ScheduledJob = {
  job: CronJob;
  id: string;
};

export type JobRequest = {
  cron: string | Date;
  fn: JobFn;
};

export function JobManager(prisma: PrismaClient) {
  let jobs: ScheduledJob[] = [];

  const unregister = (jobId: string) => {
    const { job } = jobs.find(({ id }) => id === jobId) ?? {};

    if (!(job instanceof CronJob)) {
      return;
    }

    job.stop();

    jobs = jobs.filter(({ id }) => id !== jobId);
  };

  const register = ({ cron, fn }: JobRequest) => {
    const id = nanoid(10);
    const job = new CronJob(
      cron,
      async () => await fn({ jobId: id, prisma, end: () => unregister(id) }),
      null,
      true
    );

    jobs = [...jobs, { job, id }];
  };

  return Object.freeze({ register });
}
