import { z } from "zod";
import {
  createIntegratedFunction,
  IntegratedFunction,
  respondWith,
} from "../utils/server_utils";
import { getQueue } from "../../workers/utils/queues";
import { AuthConfig } from "../utils/scan_config_template";

const CheckYTAuthToken = z.object({
  token: z.string(),
  auth: AuthConfig,
});

type CheckYTAuthToken = z.TypeOf<typeof CheckYTAuthToken>;

export const checkYTAuthToken: IntegratedFunction = createIntegratedFunction(
  "checkYTAuthToken",
  `checkYTAuthToken`,
  CheckYTAuthToken,
  async (context, body) => {
    const dispoDumpQueue = await getQueue<CheckYTAuthToken>(
      context.mqConnection,
      "checkYTAuthToken"
    );
    const { ...CheckYTAuthToken } = body;

    const job = await dispoDumpQueue.add(`${body.auth.uuid}.checkYTAuthToken`, {
      reqBody: CheckYTAuthToken,
      calls: null,
    });
    return respondWith(200, `added job to queue 'checkYTAuthToken'`, { job });
  }
);
