import express from "express";
import cors from "cors";
import streamsRoute from "./routes/streams.js";

const app = express();

/* ✅ ALLOW FRONTEND */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    }
  })
);

app.use("/api/streams", streamsRoute);

app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
