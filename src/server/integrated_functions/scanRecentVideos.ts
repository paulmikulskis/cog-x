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
    const recentVideosQueue = await getQueue<ScanRecentVideosType>(
      context.mqConnection,
      "scanRecentVideos"
    );
    await recentVideosQueue.add(`${body.auth.uuid}.scanRecentVideos`, {
      reqBody: {
        config: {
          channel_to_scan: body.config.channel_to_scan || "mine",
          filter_mode: body.config.filter_mode,
          filter_subMode: body.config.filter_subMode || "regex",
          removal_type: body.config.removal_type,
        },
        auth: body.auth,
      },
      calls: null,
    });
    return respondWith(200, `added job to queue 'scanRecentVideos'`);
  }
);
