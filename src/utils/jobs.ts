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

export type RegisterFn = (req: JobRequest) => void;

/**
 * The `JobManager` handles creating, removing, starting, and stopping jobs.
 * @param infoHandler - A function to receive messages and meta data about job status changes.
 * For example a logger.
 * @param errorHandler - A function to receive messages and meta data about job errors.
 * For example a logger.
 */
export function JobManager(
  infoHandler?: (msg: string, metaData: JobMetaData) => void,
  errorHandler?: (error: Error, metaData: JobMetaData) => void
) {
  let jobs: ScheduledJob[] = [];

  const errorWrapper = (fn: Function, metaData: JobMetaData) => {
    return async () => {
      try {
        await fn();
      } catch (error) {
        if (errorHandler instanceof Function) {
          if (!(error instanceof Error)) {
            error = new Error('Job error');
          }
          errorHandler(error as Error, metaData);
        }
      }
    };
  };

  const unregister = (jobId: string) => {
    const { job, name } = jobs.find(({ id }) => id === jobId) ?? {};

    if (!(job instanceof CronJob)) {
      return;
    }

    job.stop();

    jobs = jobs.filter(({ id }) => id !== jobId);

    if (infoHandler instanceof Function && typeof name === 'string') {
      infoHandler('Unregistered job', { id: jobId, name });
    }
  };

  const register = ({ cron, fn, name }: JobRequest) => {
    const id = nanoid(10);
    const job = new CronJob(
      cron,
      errorWrapper(() => fn({ jobId: id, end: () => unregister(id) }), {
        id,
        name,
      }),
      null,
      true, // start the job timer immediately upon registration
      undefined,
      null,
      true // run the job callback (called `onTick` in the documentation) immediately upon registration
    );

    jobs = [...jobs, { job, id, name }];

    if (infoHandler instanceof Function) {
      infoHandler('Registered a new job', { id, name });
    }
  };

  return Object.freeze({ register });
}
