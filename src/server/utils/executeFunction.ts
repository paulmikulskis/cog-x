import { IntegratedCalls, respondError } from "./server_utils";
import { Context } from "./context";
import { IntegratedFunction } from "./server_utils";
import { Logger } from "tslog";
import { scheduler } from "../integrated_functions/scheduler";
import { exampleFunc } from "../integrated_functions/exampleFunc";
import { scanEntireChannel } from "../integrated_functions/scanEntireChannel";
import { scanCommunityPost } from "../integrated_functions/scanCommunityPost";
import { scanChosenVideos } from "../integrated_functions/scanChosenVideos";
import { scanRecentVideos } from "../integrated_functions/scanRecentVideos";

const logger = new Logger();

export const integratedFunctions: (IntegratedFunction | IntegratedCalls)[] = [
  exampleFunc,
  scanEntireChannel,
  scanCommunityPost,
  scanChosenVideos,
  scanRecentVideos,
  scheduler,
];

export const executeFunction = (
  context: Context,
  functionName: string,
  rawBody: unknown
) => {
  const fn = integratedFunctions.find(({ name }) => {
    return name == functionName;
  });
  if (!fn) {
    logger.warn(
      `api tried to execute function '${functionName}', but function not integrated!`
    );
    return respondError(404, "function not found");
  }
  logger.info(`api executing function '${functionName}'`);
  return fn.fn(context, rawBody);
};
