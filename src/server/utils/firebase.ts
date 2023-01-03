import * as firebaseAdmin from "firebase-admin";
import { Logger } from "tslog";
import { config } from "dotenv";

const logger = new Logger();
config({ path: "base.env" });
config({ path: ".env", override: true });
// Initialize Firebase Admin
const initializeFirebase = () => {
  try {
    const f = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCT || "{}")
      ),
      databaseURL:
        process.env.FIREBASE_DB_URL ||
        "https://yungsten-f1a69-default-rtdb.firebaseio.com",
    });
    logger.info("Successfully initialized firebase");
    return f;
  } catch (e) {
    logger.error("Unable to initialize firebase admin " + e);
  }
};
export default initializeFirebase;
