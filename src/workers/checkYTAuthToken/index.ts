import { createIntegratedWorker } from "../utils/worker";
import axios from "axios";

export const checkYTAuthToken = async () => {
  await createIntegratedWorker(
    "checkYTAuthToken",
    async ({ reqBody, _calls }) => {
      // We can't get request headers here
      const token = reqBody.token;
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
      );

      //for now just log response
      console.log(response.data);
      try {
      } catch (e) {
        console.log(`ERROR while trying to request for the api`);
      }
    }
  );
};
