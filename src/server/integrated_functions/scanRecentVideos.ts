import { z } from "zod";
import {
  createIntegratedFunction,
  IntegratedFunction,
  respondWith,
} from "../utils/server_utils";
import { getQueue } from "../../workers/utils/queues";
import { ScanConfig, AuthConfig } from "../utils/scan_config_template";

const ScanRecentVideos = z.object({
  config: ScanConfig.extend({
    channel_to_scan: z.string().default("mine"),
  }),
  auth: AuthConfig,
});

type ScanRecentVideosType = z.TypeOf<typeof ScanRecentVideos>;

export const scanRecentVideos: IntegratedFunction = createIntegratedFunction(
  "scanRecentVideos",
  `scanRecentVideos`,
  ScanRecentVideos,
  async (context, body) => {
    const dispoDumpQueue = getQueue<ScanRecentVideosType>(
      context.mqConnection,
      "scanRecentVideos"
    );
    const { ...ScanRecentVideos } = body;

    await dispoDumpQueue.add(`customId.scanRecentVideos`, {
      reqBody: ScanRecentVideos,
      calls: null,
    });
    return respondWith(200, `added job to queue 'scanRecentVideos'`);
  }
);
