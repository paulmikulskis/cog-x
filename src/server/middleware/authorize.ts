import { Request, Response, NextFunction } from "express"
import { respondWith } from "../utils/server_utils"
import { app } from "firebase-admin/lib/firebase-namespace-api"
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier"

const authToken = (firebaseAdmin: app.App) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = getFirestore()
      const { uuid, password } = req.body.auth

      if (!uuid || !password) return res.send(respondWith(403, `Users not found`))

      const userSnapshot = await db.collection("users").doc(uuid).get()
      if (!userSnapshot.exists) return res.send(respondWith(403, `Users not found`))

      const user = userSnapshot.data()

      if (!firebaseAdmin) return res.send(respondWith(403, `Authentication Server Error`))

      firebaseAdmin
        .auth()
        .verifyIdToken(token)
        .then((decodedToken: DecodedIdToken) => {
          /* 
         Logic 2 goes here

          */
          return next()
        })
    } catch {
      return res.send(respondWith(403, `Authentication Server Error`))
    }
  }
}

export { authToken }
