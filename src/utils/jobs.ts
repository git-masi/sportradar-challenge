import { CronJob } from 'cron';
import { nanoid } from 'nanoid';

type JobFnParams = { jobId: string; end: () => void };

type JobFn = (params: JobFnParams) => Promise<void>;

type ScheduledJob = {
  job: CronJob;
  id: string;
  name: string;
};

type JobMetaData = {
  id: string;
  name: string;
};

export type JobRequest = {
  cron: string | Date;
  fn: JobFn;
  name: string;
};

export function JobManager(
  info?: (msg: string, metaData: JobMetaData) => void
) {
  let jobs: ScheduledJob[] = [];

  const unregister = (jobId: string) => {
    const { job, name } = jobs.find(({ id }) => id === jobId) ?? {};

    if (!(job instanceof CronJob)) {
      return;
    }

    job.stop();

    jobs = jobs.filter(({ id }) => id !== jobId);

    if (info instanceof Function && typeof name === 'string') {
      info('Unregistered job', { id: jobId, name });
    }
  };

  const register = ({ cron, fn, name }: JobRequest) => {
    const id = nanoid(10);
    const job = new CronJob(
      cron,
      async () => await fn({ jobId: id, end: () => unregister(id) }),
      null,
      true
    );

    jobs = [...jobs, { job, id, name }];

    if (info instanceof Function) {
      info('New job registered', { id, name });
    }
  };

  return Object.freeze({ register });
}
