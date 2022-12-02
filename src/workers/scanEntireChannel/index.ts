import { createIntegratedWorker } from "../utils/worker"
import ytpurge from "../../server/utils/ytpurgeapi"

export const scanEntireChannel = async () => {
  await createIntegratedWorker("scanEntireChannel", async ({ reqBody, _calls }) => {
    const response = await ytpurge.post(
      `/scan/${reqBody.auth.uuid}`,
      { data: reqBody.config },
      {
        auth: {
          username: reqBody.auth.uuid,
          password: reqBody.auth.password,
        },
      }
    )
    //Logic goes here
    console.log(response.data)
    try {
    } catch (e) {
      console.log(`ERROR while trying to request for the api`)
    }
  })
}
