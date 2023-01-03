import { z } from "zod";
import {
  createIntegratedFunction,
  IntegratedFunction,
  respondWith,
} from "../utils/server_utils";
import { getQueue } from "../../workers/utils/queues";

export const HealthCheckBody = z.object({
  endpoint: z.string(),
});

export type HealthCheckBodyType = z.TypeOf<typeof HealthCheckBody>;

export const healthcheck: IntegratedFunction = createIntegratedFunction(
  "healthcheck",
  `pings an endpoint`,
  HealthCheckBody,
  async (context, body) => {
    const healthcheckQueue = await getQueue<HealthCheckBodyType>(
      context.mqConnection,
      "healthcheck"
    );
    const { endpoint } = body; // we can expect a field 'miles'
    // queue a job in this queue for our new Worker to pick up:
    const job = await healthcheckQueue.add(`default`, {
      reqBody: { endpoint },
      calls: null,
    });
    // since an IntegratedFunction is ultimately a route, make sure to respond HTTP:
    return respondWith(200, `added healthcheck job pinging '${endpoint}'`, {
      job,
    });
  }
);
