import { Request, Response, NextFunction } from "express";
import { respondWith } from "../utils/server_utils";
import { app } from "firebase-admin/lib/firebase-namespace-api";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { getFirestore } from "firebase-admin/firestore";

const authToken = (firebaseAdmin: app.App) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = getFirestore();
      const { uuid, password } = req.body.auth;

      if (!uuid || !password)
        return res.send(respondWith(403, `Users not found`));

      const userSnapshot = await db.collection("users").doc(uuid).get();
      if (!userSnapshot.exists)
        return res.send(respondWith(403, `Users not found`));

      const user = userSnapshot.data();

      if (password === user?.key) {
        return next();
      } else {
        return res.send(respondWith(403, `Invalid password credentials`));
      }
    } catch {
      return res.send(respondWith(403, `Authentication Server Error`));
    }
  };
};

export { authToken };
