import Container, { Service } from "typedi";
import { RequestHandler } from "express";
import { HttpController } from "../types/baseController";
import { Controller, Get } from "../decorator/requestDefinition";
import { IpResolveFilter, LogFilter } from "../config/middleware";

@Controller("/", Container.get(LogFilter), Container.get(IpResolveFilter))
@Service()
export class HealthCheckController implements HttpController {
    @Get("/health")
    healthCheck:RequestHandler = (req, res) => {
        res.status(200).send("ok");
    };
}
