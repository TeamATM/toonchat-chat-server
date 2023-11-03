/* eslint-disable no-param-reassign */
import logger from "../logging/logger";
import { unsubscribe } from "../message_queue";
import { MessageFromClient, TypeSocket } from "./types";
import { generateRandomId, getRemoteHost } from "../utils";
import { handleOnPublishMessage } from "./publishHandler";
import { subscribeMessageQueue } from "./subscriptionHandler";

export const maxMessageLength = Number(process.env.MAX_MESSAGE_LENGTH) || 100;

// eslint-disable-next-line import/prefer-default-export
export async function handleConnection(socket:TypeSocket) {
    socket.data.username ??= `anonymous_${generateRandomId()}`;
    socket.data.remoteAddress = getRemoteHost(socket);

    logger.info({ connection: "connected", remoteHost: socket.data.remoteAddress });

    try {
        await subscribeMessageQueue(socket);
    } catch (err) {
        logger.fatal({ err, ...socket.data }, "failed to subscribe message queue");
        socket.disconnect(true);
        return;
    }

    socket.on("publish", (data: MessageFromClient) => {
        try {
            handleOnPublishMessage(socket, data);
        } catch (err) {
            logger.fatal(err, "Unhandled Exception while processing function handleOnPublishMessage.");
            socket.disconnect(true);
        }
    });

    socket.on("disconnect", () => {
        // 소켓 연결 해제시 구독 취소
        unsubscribe(socket.data.consumerTag);
        logger.info({ connection: "disconnected", remoteHost: socket.data.remoteAddress });
    });
}
