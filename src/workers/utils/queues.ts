import { QueueScheduler, Queue, BaseJobOptions } from "bullmq";
import type { Redis } from "ioredis";
import { ValidatedEnv } from "../../utils/validated-env";
import { integratedFunctions } from "../../server/utils/executeFunction";
import { Logger } from "tslog";
// import { IntegratedFunction } from "../../server/utils/server_utils"
import { connectToRedisBullmq } from "../../utils/redis";
import { env } from "..";
const logger = new Logger();

export type QueueType<B> = {
  reqBody: B;
  calls: Record<string, any> | null;
};

export type QueueTypeInput = {
  reqBody: Record<string, any> | null;
  calls: Record<string, any> | null;
};

export const getQueue = async <A>(
  redis: Redis,
  queueName: string,
  defaultJobOptions?: BaseJobOptions
): Promise<Queue<QueueType<A>, unknown, string>> => {
  const attempts = 1;
  logger.info(
    `connecting to queue ${queueName}, QueueConfig: attempts=${attempts}`
  );
  return new Queue<QueueType<A>>(queueName, {
    connection: await connectToRedisBullmq(env),
    defaultJobOptions: defaultJobOptions ?? {
      attempts: attempts,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: 1000,
      removeOnFail: 1000,
    },
  });
};

export const initCogCoreQueues = async (
  env: ValidatedEnv
): Promise<QueueScheduler[]> => {
  const schedulers: QueueScheduler[] = [];
  for (let i = 0; i < integratedFunctions.length; i++) {
    const regisConnectionm = await connectToRedisBullmq(env);
    schedulers.push(
      new QueueScheduler(integratedFunctions[i].queueName, {
        connection: regisConnectionm,
      })
    );
  }
  return schedulers;
};
