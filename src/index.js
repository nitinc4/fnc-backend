import dotenv from "dotenv";
dotenv.config();

import connect from "./db/mongoDB.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Mongoose Connection Error", error);
  });
