import { Request, Response, NextFunction } from "express"
import { respondWith } from "../utils/server_utils"
import { app } from "firebase-admin/lib/firebase-namespace-api"
import { getFirestore } from "firebase-admin/firestore"

// eslint-disable-next-line unused-imports/no-unused-vars
const authToken = (firebaseAdmin: app.App) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = getFirestore()
      const auth = req.headers.authorization
      if (!auth) {
        return res.send(respondWith(403, `Basic HTTP auth info not found`))
      }
      const decodedAuth = Buffer.from(auth.split(" ")[1] || "", "base64")
        .toString("utf8")
        .split(":")
      const uuid = decodedAuth[0]
      const password = decodedAuth[1]
      if (!uuid || !password)
        return res.send(respondWith(403, `User's complete auth info not found`))

      const userSnapshot = await db.collection("users").doc(uuid).get()
      if (!userSnapshot.exists) return res.send(respondWith(403, `Users not found`))

      const user = userSnapshot.data()

      if (password === user?.key) {
        return next()
      } else {
        return res.send(respondWith(403, `Invalid password credentials`))
      }
    } catch {
      return res.send(respondWith(403, `Authentication Server Error`))
    }
  }
}

export { authToken }
