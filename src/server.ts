/* eslint-disable no-param-reassign */
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { Router, Application } from "express";
import Container, { Service } from "typedi";
import { EnvConfig, logger } from "./config";

@Service()
export class Server {
    private port;

    private app;

    private server:http.Server;

    constructor(envConfig:EnvConfig) {
        this.app = Container.get<Application>("app");
        this.server = Container.get(http.Server);
        this.port = envConfig.port;
        const corsOrigin = envConfig.corsAllowOrigin;
        logger.info(`allowed cors origin: ${corsOrigin}`);

        this.configureExpress(corsOrigin);
    }

    public useRouter = (prefix: string, router: Router) => {
        this.app.use(prefix, router);
    };

    public startServer = () => this.server.listen(
        this.port,
        () => { logger.info(`Server is running on port ${this.port}`); },
    );

    private configureExpress = (corsOrigin: string) => {
        this.app.use(helmet({ hsts: true, frameguard: true, xXssProtection: true }), cors({
            origin: corsOrigin,
        }));
    };
}
