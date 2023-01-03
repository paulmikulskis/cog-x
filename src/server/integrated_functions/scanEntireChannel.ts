import { z } from "zod";
import {
  createIntegratedFunction,
  IntegratedFunction,
  respondWith,
} from "../utils/server_utils";
import { getQueue } from "../../workers/utils/queues";
import { ScanConfig, AuthConfig } from "../utils/scan_config_template";

const ScanEntireChannelBody = z.object({
  config: ScanConfig.extend({
    max_comments: z.number(),
  }),
  auth: AuthConfig,
});

type ScanEntireChannelBodyType = z.TypeOf<typeof ScanEntireChannelBody>;

export const scanEntireChannel: IntegratedFunction = createIntegratedFunction(
  "scanEntireChannel",
  `scan entire channel`,
  ScanEntireChannelBody,
  async (context, body) => {
    const dispoDumpQueue = await getQueue<ScanEntireChannelBodyType>(
      context.mqConnection,
      "scanEntireChannel"
    );
    const { ...ScanEntireChannelBody } = body;

    await dispoDumpQueue.add(`${body.auth.uuid}.scanEntireChannel`, {
      reqBody: ScanEntireChannelBody,
      calls: null,
    });
    return respondWith(200, `added job to queue 'scanEntireChannel'`);
  }
);
