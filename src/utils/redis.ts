import Redis from "ioredis";

// https://github.com/OptimalBits/bull/issues/503
// import EventEmitter from "events"
import { ValidatedEnv } from "./validated-env";
import { Logger } from "tslog";
const logger = new Logger();

// EventEmitter.defaultMaxListeners = 20

export const connectToRedis = (
  env: ValidatedEnv,
  options: Redis.RedisOptions
): Promise<Redis.Redis> => {
  env.REDIS_FQDN.length > 1
    ? logger.info(`connecting to redis with TLS on ${env.REDIS_FQDN}`)
    : logger.info(
        ` connecting to redis (no-tls) at ${env.REDIS_HOST}:${env.REDIS_PORT}`
      );
  const redis =
    env.REDIS_FQDN.length > 1
      ? new Redis(env.REDIS_FQDN)
      : new Redis({
          port: env.REDIS_PORT,
          host: env.REDIS_HOST,
          ...options,
        });
  return new Promise((resolve, reject) => {
    redis.on("connect", () => {
      logger.info("redis successfully connected");
      resolve(redis);
    });
    redis.on("error", (err: Error) => {
      logger.error("redis connection failed: ", err.message);
      reject(err);
    });
  });
};

export const connectToRedisBullmq = async (
  env: ValidatedEnv
): Promise<Redis.Redis> =>
  connectToRedis(env, { maxRetriesPerRequest: null, enableReadyCheck: false });
