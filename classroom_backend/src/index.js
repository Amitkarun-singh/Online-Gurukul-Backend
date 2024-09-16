import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js"; // Correct import path
import { app } from "./app.js";
import cors from "cors"; // Import cors

dotenv.config({
  path: './.env'
});

app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true 
}));

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed!!! ", err);
  });
