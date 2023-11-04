import { ConsumeMessage } from "amqplib";

export interface SubscribeEventEmiitter {
    consumerTag: string,
    // eslint-disable-next-line no-unused-vars
    callback: (message:ConsumeMessage) => void;
}
