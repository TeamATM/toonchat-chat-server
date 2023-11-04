/* eslint-disable no-param-reassign */
import { CustomErrorError, CustomWarnError } from "../../exceptions/exception";
import { logger } from "../../logging";
import { unsubscribe } from "../../message_queue";
import { TypeSocket, MessageFromClient } from "../../types";
import { generateRandomId, getClientIpAddress } from "../../utils";
import { handleOnPublishMessage } from "./publishHandler";
import { subscribeMessageQueue } from "./subscriptionHandler";

export const maxMessageLength = Number(process.env.MAX_MESSAGE_LENGTH) || 100;

export async function handleConnection(socket:TypeSocket) {
    socket.data.userId ??= `anonymous_${generateRandomId()}`;
    socket.data.remoteAddress = getClientIpAddress(socket);

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
            if (err instanceof CustomWarnError) {
                logger.warn({ userId: socket.data.userId, content: data.content }, err.message);
                socket.emit("error", { content: err.message });
            } else if (err instanceof CustomErrorError) {
                logger.error(err, err.message);
                socket.emit("error", { content: err.message });
            } else {
                logger.fatal(err, "Unhandled Exception while processing function handleOnPublishMessage.");
                socket.disconnect(true);
            }
        }
    });

    socket.on("disconnect", () => {
        // 소켓 연결 해제시 구독 취소
        unsubscribe(socket.data.consumerTag);
        logger.info({ connection: "disconnected", remoteHost: socket.data.remoteAddress });
    });
}
