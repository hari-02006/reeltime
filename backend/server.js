require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const connectDatabase = require("./config/db");
const movieRoutes = require("./routes/movieRoutes");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use("/api/movies", movieRoutes);
app.get("/api/health", (req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    success: mongoose.connection.readyState === 1,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});
app.use(express.static(path.resolve(__dirname, "../frontend")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API endpoint not found." });
  }
  return res.sendFile(path.resolve(__dirname, "../frontend/index.html"), (error) => {
    if (error) next(error);
  });
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body must contain valid JSON." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large." });
  }
  console.error("Request failed:", error);
  return res.status(500).json({ success: false, message: "An unexpected server error occurred." });
});

async function startServer() {
  await connectDatabase();
  const server = app.listen(port, () => {
    console.log(`Reel Time is ready at http://localhost:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Closing server...`);
    server.close(async (error) => {
      if (error) {
        console.error("Error closing HTTP server:", error);
        process.exitCode = 1;
      }
      await mongoose.disconnect();
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("Unable to start Reel Time:", error.message);
  process.exitCode = 1;
});

module.exports = app;
