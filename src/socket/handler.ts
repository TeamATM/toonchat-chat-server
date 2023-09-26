/* eslint-disable no-param-reassign */
import { MongooseError } from "mongoose";
import logger from "../logger";
import { publish, subscribe, unsubscribe } from "../message_queue/broker";
import { buildEchoMessage, buildInferenceMessage } from "../message_queue/util";
import {
    saveUserMessage, findSimilarDocuments, getCharacterPersona,
} from "../mongo/mongodb";
import { existMessageInProcess } from "../redis/redis";
import { MessageFromClient, TypeSocket } from "../types";
import { generateRandomId } from "../utils";
import { EmbeddingDocument, HistoryDocument, PersonaDocument } from "../mongo/types";
import { InvalidRequestError } from "../exception";

const maxMessageLength = Number(process.env.MAX_MESSAGE_LENGTH) || 100;

async function checkCanRequest(userId:string, characterId:number, content:string) {
    // 글자수 제한
    if (!content || content.length > maxMessageLength) {
        const msg = "Message is empty or too long";
        logger.warn({ userId, characterId, content }, msg);
        throw new InvalidRequestError(msg);
    }

    // validate characterId
    const persona = await getCharacterPersona(characterId);
    if (persona === undefined) {
        const msg = "Invalid characterId";
        logger.warn({ userId, characterId, content }, msg);
        throw new InvalidRequestError(msg);
    }

    // 한 계정당 동시 요청 가능 개수 제한
    if (existMessageInProcess(userId)) {
        const msg = "아직 처리중인 메시지가 있습니다. 이전 요청이 처리된 이후에 다시 시도하세요";
        logger.warn({ userId, characterId, content }, msg);
        throw new InvalidRequestError(msg);
    }

    return persona;
}

function publishMessage(
    promiseResult: [HistoryDocument?, EmbeddingDocument[]?],
    userId: string,
    persona:PersonaDocument,
) {
    const [history, vectorSearchResult] = promiseResult;
    if (history === undefined) {
        logger.error("history is undefined");
        throw new MongooseError("history is undefined");
    }

    logger.trace({ userId, characterId: history.characterId, msg: history });
    logger.debug(history, `history of user: ${userId}`);

    // publish or echo
    publish("amq.topic", userId, buildEchoMessage(history));
    // publish for inference
    publish("celery", "celery", buildInferenceMessage(history, persona, vectorSearchResult));
}

async function handleOnPublishMessage(socket:TypeSocket, data:MessageFromClient) {
    const { username: userId } = socket.data;
    let persona:PersonaDocument;

    try {
        persona = await checkCanRequest(userId, data.characterId, data.content);
    } catch (err) {
        if (err instanceof Error) socket.emit("error", { content: err.message });
        else logger.fatal(err, "Unhandled Exception");
        return;
    }

    // 몽고디비 연결해서 메시지 저장 & 이전 대화내역 가져오기 => 메시지큐 전달
    Promise.all([
        saveUserMessage(userId, data.characterId, data.content),
        findSimilarDocuments(data.content),
    ]).then((result) => {
        publishMessage(result, userId, persona);
    }).catch((err) => { logger.error(err); });
}

// eslint-disable-next-line import/prefer-default-export
export async function handleConnection(socket:TypeSocket) {
    if (!socket.data.username) socket.data.username = `anonymous_${generateRandomId()}`;

    logger.info({ connection: "connected", host: socket.handshake.address });

    try {
        // 구독 && 구독 취소를 위한 정보 저장
        const consumerTag = await subscribe(
            `${socket.data.username}_${generateRandomId()}`,
            socket.data.username,
            { durable: false, autoDelete: true },
            async (msg) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { userId, ...messageToClient } = msg;
                return socket.emit("subscribe", messageToClient);
            },
        );
        socket.data.consumerTag = consumerTag;
    } catch (err) {
        logger.fatal(err, `failed to subscribe user: ${socket.data.username}`);
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
        logger.info({ connection: "disconnected", host: socket.handshake.address });
    });
}
