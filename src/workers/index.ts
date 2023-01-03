import { exampleFunc } from "./example-func";
import { scanEntireChannel } from "./scanEntireChannel";
import { scanCommunityPost } from "./scanCommunityPost";
import { scanChosenVideos } from "./scanChosenVideos";
import { scanRecentVideos } from "./scanRecentVideos";
import { scanCommentList } from "./scanCommentList";
import { checkYTAuthToken } from "./checkYTAuthToken";
import { healthcheck } from "./healthcheck";
import { Worker } from "bullmq";
import { range } from "lodash";
import { Logger } from "tslog";
import { exit } from "process";
import { config } from "dotenv";
import { ValidatedEnv } from "../utils/validated-env";
import { z } from "zod";
import { connectToRedisBullmq } from "../utils/redis";
import { integratedFunctions } from "../server/utils/executeFunction";

export const env = ValidatedEnv.parse(process.env);

(async function () {
  const mqConnection = await connectToRedisBullmq(env);
  const logger = new Logger();
  logger.info(`starting worker stack...`);
  config({ path: "base.env" });
  config({ path: ".env", override: true });
  const integratedWorkers = [
    exampleFunc,
    scanEntireChannel,
    scanCommunityPost,
    scanChosenVideos,
    scanRecentVideos,
    scanCommentList,
    checkYTAuthToken,
    healthcheck,
  ];

  const workers = integratedWorkers.map((w) => {
    const calledFunc = integratedFunctions.find((f) => f.name === w.name);
    logger.debug(`starting worker: '${w.name}'`);
    return range(0, env.WORKER_COUNT).map(() => {
      return new Worker<z.TypeOf<typeof calledFunc.schema>>(
        calledFunc.queueName,
        w(),
        {
          connection: mqConnection,
          concurrency: env.WORKER_CONCURRENCY,
          limiter: {
            max: 10,
            duration: 1000,
          },
        }
      );
    });
  });

  const workerNames = workers.map((w) => w[0] && w[0].name);
  logger.debug(`registered ${workers.length} workers`);
  logger.debug(
    `worker names: ${workerNames.toString().replace("[", "").replace("]", "")}`
  );
  const allTheWorkers = workers;

  const args = process.argv.slice(2);
  // will be the name of the service to run via command line argument
  const arg = args[0];
  if (!arg || arg === "all") {
    logger.warn(
      `no worker name specifed to the worker stack!  will attempt to run all workers...`
    );
    await allTheWorkers;
  } else if (workerNames.indexOf(arg) >= 0) {
    const i = workerNames.indexOf(arg);
    const worker = workers[i];
    if (!worker) {
      logger.error(
        `started against worker '${arg}' but no matching worker integration found`
      );
      exit(20);
    }
    logger.info(`starting service: '${worker[0].name}'`);
  } else {
    logger.error(
      `started against worker '${arg}' but no matching worker integration found`
    );
    exit(20);
  }
})();
