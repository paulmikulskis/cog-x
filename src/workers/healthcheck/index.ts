import { createIntegratedWorker } from "../utils/worker"
import axios from "axios"

export const healthcheck = async () => {
  await createIntegratedWorker("healthcheck", async ({ reqBody, _calls }) => {
    // We can't get request headers here
    const endpoint = reqBody.endpoint
    const response = await axios.get(endpoint)

    //for now just log response
    console.log(response.data)
    try {
    } catch (e) {
      console.log(`ERROR while trying to send healthcheck ping to '${endpoint}'`)
    }
  })
}
