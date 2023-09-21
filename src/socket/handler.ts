/* eslint-disable no-param-reassign */
import logger from "../logger";
import { publish, sub, unsubscribe } from "../message_queue/broker";
import { buildMessage } from "../message_queue/util";
import { saveUserMessage, getChatHistoryByLimit } from "../mongo/mongodb";
import { existMessageInProcess } from "../redis/redis";
import { MessageFromClient, TypeSocket } from "../types";
import { generateRandomId } from "../utils";

const maxMessageLength = Number(process.env.MAX_MESSAGE_LENGTH) || 100;

function checkCanRequest(userId:string, content:string) {
    let errorMessage:string = "";

    // 글자수 제한
    if (!content || content.length > maxMessageLength) {
        logger.warn(`Message length exceeded from user: ${userId}, message: ${content}`);
        errorMessage = "Message is empty or too long";
        return errorMessage;
    }

    // 한 계정당 동시 요청 가능 개수 제한
    if (existMessageInProcess(userId)) {
        logger.warn(`Too many requests from user: ${userId}`);
        errorMessage = "아직 처리중인 메시지가 있습니다. 이전 요청이 처리된 이후에 다시 시도하세요";
        return errorMessage;
    }

    return errorMessage;
}

async function handleOnPublishMessage(socket:TypeSocket, data:MessageFromClient) {
    const { username: userId } = socket.data;

    const errorMessage = checkCanRequest(userId, data.content);
    if (errorMessage) {
        socket.emit("error", { content: errorMessage });
        return;
    }

    // 몽고디비 연결해서 메시지 저장 & 이전 대화내역 가져오기 => 메시지큐 전달
    Promise.all([
        saveUserMessage(userId, data.characterId, data.content),
        getChatHistoryByLimit(userId, data.characterId, 10),
    ]).then((result) => {
        const [message, history] = result;

        logger.info({ userId, characterId: message.characterId, msg: message.content });
        logger.debug(history, `history of user: ${userId}`);
        // ACK를 위한 pub
        publish("amq.topic", userId, buildMessage(message));
        // 추론을 위한 pub
        publish("celery", "celery", buildMessage(message, history));
    }).catch(logger.error);
}

// eslint-disable-next-line import/prefer-default-export
export async function handleConnection(socket:TypeSocket) {
    if (!socket.data.username) socket.data.username = `anonymous_${generateRandomId()}`;

    logger.info({ connection: "connected", host: socket.handshake.address });

    try {
        // 구독 && 구독 취소를 위한 정보 저장
        const consumerTag = await sub(`${socket.data.username}_${generateRandomId()}`, socket.data.username, { durable: false, autoDelete: true }, async (msg) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { userId, ...messageToClient } = msg;
            return socket.emit("subscribe", messageToClient);
        });
        socket.data.consumerTag = consumerTag;
    } catch (err) {
        logger.fatal(err, `failed to subscribe user: ${socket.data.username}`);
    }

    socket.on("publish", (data: MessageFromClient) => handleOnPublishMessage(socket, data));

    socket.on("disconnect", () => {
        // 소켓 연결 해제시 구독 취소
        unsubscribe(socket.data.consumerTag);
        logger.info({ connection: "disconnected", host: socket.handshake.address });
    });
}
