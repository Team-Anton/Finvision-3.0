const createApp = require("./app");
const { env, requireRuntimeEnv } = require("./config/env");
const { initDb } = require("./config/initDb");

async function startServer() {
  requireRuntimeEnv();
  await initDb();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`FineVision backend listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start FineVision backend:", error.message);
  process.exit(1);
});
