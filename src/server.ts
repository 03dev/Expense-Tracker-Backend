import { env } from "./config/env";
import app from "./app";
import { logger } from "./utils/logger";
const HOST = '0.0.0.0';

app.listen(env.PORT, HOST, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`Server is accessible at http://${HOST}:${env.PORT}`);
});