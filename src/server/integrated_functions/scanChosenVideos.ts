import { z } from "zod";
import {
  createIntegratedFunction,
  IntegratedFunction,
  respondWith,
} from "../utils/server_utils";
import { getQueue } from "../../workers/utils/queues";
import { ScanConfig, AuthConfig } from "../utils/scan_config_template";

const ScanChosenVideos = z.object({
  config: ScanConfig.extend({
    videos_to_scan: z.string().array(),
  }),
  auth: AuthConfig,
});

type ScanChosenVideosType = z.TypeOf<typeof ScanChosenVideos>;

export const scanChosenVideos: IntegratedFunction = createIntegratedFunction(
  "scanChosenVideos",
  `scanChosenVideos`,
  ScanChosenVideos,
  async (context, body) => {
    const dispoDumpQueue = await getQueue<ScanChosenVideosType>(
      context.mqConnection,
      "scanChosenVideos"
    );
    const { ...ScanChosenVideos } = body;

    await dispoDumpQueue.add(`${body.auth.uuid}.scanChosenVideos`, {
      reqBody: ScanChosenVideos,
      calls: null,
    });
    return respondWith(200, `added job to queue 'scanChosenVideos'`);
  }
);
