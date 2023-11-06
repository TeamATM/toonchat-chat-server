/* eslint-disable arrow-body-style */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";
import Container from "typedi";
import { Router } from "express";
import { logger } from "../config";
import { Filter } from "../types";
import { Server } from "../server";

export interface RouteDefinition {
    path: string;
    method: "get" | "post" | "delete" | "patch";
    methodName: string;
}

export const Controller = (prefix: string, ...filters:Array<Filter>): ClassDecorator => {
    return (target: any) => {
        Reflect.defineMetadata("prefix", prefix, target);
        if (!Reflect.hasMetadata("routes", target)) {
            Reflect.defineMetadata("routes", [], target);
        }

        const routes: Array<RouteDefinition> = Reflect.getMetadata("routes", target);
        const instance: any = Container.get(target);
        const router = Router();

        filters.forEach((filter) => {
            logger.debug({ filter, controller: target.name });
            router.use(filter.doFilter);
        });

        routes.forEach((route: RouteDefinition) => {
            logger.debug({ path: `${prefix}${route.path}`, method: route.methodName, controller: target.name });
            router[route.method](`${route.path}`, instance[route.methodName].bind(instance));
        });

        Container.set(target.constructor.name, target);
        Container.get(Server).useRouter(prefix, router);
    };
};

export const Get = (path: string) => {
    return (target: any, propertyKey: string): void => {
        if (!Reflect.hasMetadata("routes", target.constructor)) {
            Reflect.defineMetadata("routes", [], target.constructor);
        }

        const routes:Array<RouteDefinition> = Reflect.getMetadata("routes", target.constructor);
        routes.push({
            method: "get",
            path,
            methodName: propertyKey,
        });
        Reflect.defineMetadata("routes", routes, target.constructor);
    };
};
