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

/**
 * The `JobManager` handles creating, removing, starting, and stopping jobs.
 * @param info - A function to receive messages and meta data about job status changes.
 * For example a logger.
 */
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
      true, // start the job timer immediately upon registration
      undefined,
      null,
      true // run the job callback (called `onTick` in the documentation) immediately upon registration
    );

    jobs = [...jobs, { job, id, name }];

    if (info instanceof Function) {
      info('Registered a new job', { id, name });
    }
  };

  return Object.freeze({ register });
}
