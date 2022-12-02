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
    const dispoDumpQueue = getQueue<CheckYTAuthToken>(
      context.mqConnection,
      "checkYTAuthToken"
    );
    const { ...CheckYTAuthToken } = body;

    await dispoDumpQueue.add(`customId.checkYTAuthToken`, {
      reqBody: CheckYTAuthToken,
      calls: null,
    });
    return respondWith(200, `added job to queue 'checkYTAuthToken'`);
  }
);
