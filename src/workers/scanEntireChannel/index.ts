import { createIntegratedWorker } from "../utils/worker"
import ytpurge from "../../server/utils/ytpurgeapi"

export const scanEntireChannel = async () => {
  await createIntegratedWorker("scanEntireChannel", async ({ reqBody, _calls }) => {
    const response = await ytpurge.post(
      `/scan/${reqBody.auth.uuid}`,
      {
        data: {
          settings: {
            scan_mode: "entirechannel",
            ...reqBody.config,
          },
        },
      },
      {
        auth: {
          username: reqBody.auth.uuid,
          password: reqBody.auth.password,
        },
      }
    )
    if (response.status !== 200) {
      const msg = `Core API returned [${response.status}] "${
        response.statusText || response.data
      }",`
      console.log(msg)
    } else {
      const msg = `successfully scanned entire channel for user "${reqBody.auth.uuid}"`
      console.log(msg)
    }
    console.log(`successfully did scanEntireChannel for user "${reqBody.auth.uuid}"`)
  })
}
