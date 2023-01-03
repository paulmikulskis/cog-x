import { z } from "zod";
import {
  createIntegratedFunction,
  IntegratedFunction,
  respondWith,
} from "../utils/server_utils";
import { getQueue } from "../../workers/utils/queues";
import { ScanConfig, AuthConfig } from "../utils/scan_config_template";

const ScanCommunityPost = z.object({
  config: ScanConfig.extend({
    max_comments: z.number(),
    com_post_id: z.string(),
  }),
  auth: AuthConfig,
});

type ScanCommunityPostType = z.TypeOf<typeof ScanCommunityPost>;

export const scanCommunityPost: IntegratedFunction = createIntegratedFunction(
  "scanCommunityPost",
  `scanCommunityPost`,
  ScanCommunityPost,
  async (context, body) => {
    const dispoDumpQueue = await getQueue<ScanCommunityPostType>(
      context.mqConnection,
      "scanCommunityPost"
    );
    const { ...ScanCommunityPost } = body;

    await dispoDumpQueue.add(`${body.auth.uuid}.scanCommunityPost`, {
      reqBody: ScanCommunityPost,
      calls: null,
    });
    return respondWith(200, `added job to queue 'scanCommunityPost'`);
  }
);
