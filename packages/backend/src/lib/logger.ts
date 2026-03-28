import pino from "pino";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== "production";

const targets: pino.TransportTargetOptions[] = [
  {
    target: isDev ? "pino-pretty" : "pino/file",
    options: isDev ? { destination: 1 } : { destination: 1 },
    level: "info",
  },
  {
    target: "pino/file",
    options: {
      destination: path.resolve(__dirname, "../../trace.log"),
      mkdir: true,
    },
    level: "info",
  },
];

const logger = pino({
  level: "info",
  transport: { targets },
});

export default logger;
