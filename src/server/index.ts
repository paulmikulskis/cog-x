import express from "express";
import { executeFunction, integratedFunctions } from "./utils/executeFunction";
import { config } from "dotenv";
import { getContext } from "./utils/context";
import { initialize } from "./utils/initialize";
import { Logger } from "tslog";
import { getScheduleableFunctions, respondWith } from "./utils/server_utils";
import { getQueue, QueueType } from "../workers/utils/queues";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import {
  jobIdToCron,
  jobIdToFunctionName,
  jobIdToUserName,
  jobIdToWorkflowName,
  repeatJobId,
} from "./utils/job_utils";
import { authToken } from "./middleware/authorize";
import initializeFirebase from "./utils/firebase";
import { Queue } from "bullmq";
import { connectToRedis } from "../utils/redis";
(async function () {
  const logger = new Logger();

  config({ path: "base.env" });
  config({ path: ".env", override: true });

  const app = express();
  //app.use(express.json())
  app.set("view engine", "ejs");
  app.use(express.json());
  // app.use(express.static(path.join(__dirname, "public")))
  // app.use("/css", express.static(path.join(__dirname, "node_modules/bootstrap/dist/css")))

  const context = await getContext(process.env);
  await initialize(context);

  app.get("/", async (_, res) => {
    const redisConnection = await connectToRedis(context.env, {});
    const status = {
      host: context.env.API_HOST,
      numberOfIntegratedFunctions: getIntegratedFunctions().length,
      numberOfScheduledWorkflows: Object.keys(getWorkflowSchedule()).length,
      redis: {
        host: redisConnection.options.host,
        port: redisConnection.options.port,
        tls: redisConnection.options.sentinelTLS !== undefined,
      },
    };
    // res.send(respondWith(200, `OK - cog is up!`, { status }))
    res.render("pages/index", { status });
  });

  //Initialize firebase and Auth middleware
  // any routes below here will be secured with the auth middleware
  const firebaseAdmin = initializeFirebase();
  if (!firebaseAdmin) return;
  app.use(authToken(firebaseAdmin));

  app.post<{ parameter: string }>("/api/:parameter", async (req, res) => {
    const param = req.params.parameter;
    logger.info(`received request to execute function '${param}'`);
    const response = await executeFunction(context, param, req.body);
    res.send(response);
  });

  app.get<{ workflowName: string }>(
    "/api/remove-workflow/:workflowName",
    async (req, res) => {
      const workflowName = req.params.workflowName;
      const workflowSchedule = await getWorkflowSchedule(true);
      const job = workflowSchedule[workflowName];
      logger.info(`received request to remove workflow '${workflowName}'`);
      if (!job) {
        const msg = `workflow '${workflowName}' not found!`;
        logger.warn(msg);
        // TODO wrap in ApiResponse type
        return res.send(msg);
      }
      if (!job["queueName"]) {
        const msg = `no queueName found for workflow ${workflowName}!`;
        logger.warn(msg);
        return res.send(msg);
      }
      const queue = await getQueue(
        context.mqConnection,
        job["queueName"] || "default"
      );
      queue.removeRepeatableByKey(job["key"]);
      const workflow = {
        workflowName,
        cron: job["cron"],
        user: jobIdToUserName(job["key"]),
        key: job["key"],
        reqBody: job["reqBody"],
      };
      return res.send(
        respondWith(
          200,
          `successfully removed workflow '${workflowName}'`,
          workflow
        )
      );
    }
  );

  app.get("/api/scheduled-workflows", async (req, res) => {
    const workflowSchedule = await getWorkflowSchedule(
      req.body?.extendedDetails
    );
    return res.send(
      respondWith(
        200,
        `found ${Object.keys(workflowSchedule).length} workflows`,
        workflowSchedule
      )
    );
  });

  app.get("/api/integrated-functions", async (req, res) => {
    const functions = getIntegratedFunctions();
    return res.send(
      respondWith(
        200,
        `found ${Object.keys(functions).length} integrated functions`,
        { functions }
      )
    );
  });

  const getWorkflowSchedule = async (extendedDetails = false) => {
    const jobs = [];
    const funcs = getScheduleableFunctions();
    const queues: Queue<QueueType<any>, unknown, string>[] = [];
    for (let i = 0; i < funcs.length; i++) {
      const fn = funcs[i];
      type ReqBody = z.TypeOf<typeof fn.schema>;
      queues.push(await getQueue<ReqBody>(context.mqConnection, fn.queueName));
    }
    for (let i = 0; i < queues.length; i++) {
      const queue = queues[i];
      const fn = funcs[i];
      if (!queue || !fn) continue;
      const queuedJobs = await queue.getRepeatableJobs();
      const jobList = [];
      for (let i = 0; i < queuedJobs.length; i++) {
        const job = queuedJobs[i];
        const jobId = repeatJobId(
          job?.name || "",
          job?.next || 1,
          job?.key || ""
        );
        if (!job) continue;
        const jobDetails = await queue.getJob(jobId);
        if (!jobDetails) continue;
        const workflowName = jobIdToWorkflowName(job.name);
        const functionName = jobIdToFunctionName(job.name);
        const cron = jobIdToCron(job.name);
        extendedDetails
          ? jobList.push({
              [workflowName]: {
                queueName: queue.name,
                id: job.id,
                jobName: job.name,
                next: job.next,
                key: job.key,
                functionName,
                cron,
                reqBody: jobDetails?.data,
              },
            })
          : jobList.push({
              [workflowName]: {
                functionName,
                cron,
                reqBody: jobDetails?.data.reqBody,
                calls: jobDetails?.data.calls,
              },
            });
      }
      jobs.push(jobList);
    }
    return Object.fromEntries(
      jobs
        .flat()
        .map((e: Record<string, unknown>) => [
          Object.keys(e)[0],
          Object.values(e)[0],
        ])
    );
  };

  const getIntegratedFunctions = () => {
    return integratedFunctions.map((fn) => {
      return {
        functionName: fn.name,
        description: fn.description,
        scheduleable: fn.scheduleable,
        schema: zodToJsonSchema(fn.schema),
      };
    });
  };
  app.listen(context.env.API_PORT, () => {
    logger.info(`cog-core-api listening on port ${context.env.API_PORT}`);
  });
})();
