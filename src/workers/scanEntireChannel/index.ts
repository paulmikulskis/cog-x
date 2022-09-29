import { createIntegratedWorker } from "../utils/worker";
import ytpurge from "../../server/utils/ytpurgeapi";

export const scanEntireChannel = async () => {
  await createIntegratedWorker(
    "scanEntireChannel",
    async ({ reqBody, _calls }) => {
      const config = reqBody;
      const response = await ytpurge.post(`/scan/${config.uuid}`, {
        auth: {
          username: config.uuid,
          password: config.password,
        },
      });
      //Logic goes here
      try {
      } catch (e) {
        console.log(`ERROR while trying to request for the api`);
      }
    }
  );
};
