/* eslint-disable arrow-body-style */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Container from "typedi";
import { logger } from "../config";
import { SocketEventDispatcher } from "../controller/socketEventDispatcher";

export interface EventDefinition {
    event: string;
    methodName: string;
}

export const EventController = (): ClassDecorator => {
    return (target: any) => {
        if (!Reflect.hasMetadata("routes", target)) {
            Reflect.defineMetadata("routes", [], target);
        }

        const routes: Array<EventDefinition> = Reflect.getMetadata("routes", target);
        const instance: any = Container.get(target);
        const eventDispatcher = Container.get(SocketEventDispatcher);

        routes.forEach((route: EventDefinition) => {
            logger.debug({ event: `${route.event}`, method: route.methodName, controller: target.name });
            eventDispatcher.registEvent(route.event, instance[route.methodName]);
        });

        Container.set(target.constructor.name, target);
    };
};

export const Event = (event: string) => {
    return (target: any, propertyKey: string): void => {
        if (!Reflect.hasMetadata("routes", target.constructor)) {
            Reflect.defineMetadata("routes", [], target.constructor);
        }

        const routes:Array<EventDefinition> = Reflect.getMetadata("routes", target.constructor);
        routes.push({
            event,
            methodName: propertyKey,
        });
        Reflect.defineMetadata("routes", routes, target.constructor);
    };
};
