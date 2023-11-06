import { pino } from "pino";
import Container from "typedi";
import { EnvConfig } from "./config";

export const logger = pino({
    level: Container.get(EnvConfig).logLevel,
});
