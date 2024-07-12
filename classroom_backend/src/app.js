import express from "express";
import userRouter from "./routes/user.js";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middlewares/error.js";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

export const app = express();

config({
  path: "./data/config.env",
});

// Ensure uploads directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Using Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Using routes
app.use("/api/v1/users", userRouter);

app.get("/", (req, res) => {
  res.send("Nice working");
});

// Using Error Middleware
app.use(errorMiddleware);
export default app;


// import express from "express";
// import cors from "cors";
// import cookieparser from "cookie-parser";

// const app = express();

// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }))

// app.use(express.json({limit: "16kb"}));
// app.use(express.urlencoded({extended: true, limit: "16kb"}));
// app.use(express.static("public"));
// app.use(cookieparser());

// export default app;