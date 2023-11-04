/* eslint-disable no-param-reassign */
import { logger } from "../../config";
import { searchSimilarDocuments } from "../../service/embeddingService";
import { updateHistory, updateMessage } from "../../service";
import { checkCanRequest, getCharacter } from "./validator";
import {
    MessageFromClient, TypeSocket, Message,
    ConsumeMessageCallback, MessageFromInferenceServer,
} from "../../types";
import {
    buildEchoMessage, buildInferenceMessage,
    buildUserMessage, publish, subscribe,
} from "../../message_queue";
import { generateRandomId } from "../../utils";

export async function handleOnPublishMessage(socket: TypeSocket, data: MessageFromClient) {
    const { userId } = socket.data;
    const character = await checkCanRequest(userId, data.characterId, data.content)
        .then(() => getCharacter(data.characterId));

    const msg: Message = buildUserMessage(data.content);
    updateMessage(userId, data.characterId, msg).then(() => {
        const echoMessage = buildEchoMessage(msg, data.characterId);
        publish("amq.topic", userId, echoMessage)
            .catch((err) => {
                socket.emit("error", { content: "요청 처리에 실패하였습니다. 다시 시도해주세요" });
                logger.error(err, "failed to publish");
            });
    });

    // 몽고디비 연결해서 메시지 저장 & 이전 대화내역 가져오기 => 메시지큐 전달
    const [history, vectorSearchResult] = await Promise.all([
        updateHistory(userId, data.characterId, msg),
        searchSimilarDocuments(data.content),
    ]);

    const inferenceMessage = buildInferenceMessage(history, character, vectorSearchResult);
    publish("celery", "celery", inferenceMessage)
        .catch((err) => {
            socket.emit("error", { content: "요청 처리에 실패하였습니다. 다시 시도해주세요" });
            logger.error(err, "failed to publish");
        });
}

export async function subscribeMessageQueue(socket: TypeSocket) {
    const onMessageToUser: ConsumeMessageCallback = async (message) => {
        const messageFromMq: MessageFromInferenceServer = JSON.parse(message.content.toString("utf-8"));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { userId, ...messageToClient } = messageFromMq;
        socket.emit("subscribe", messageToClient);
    };

    // 구독 && 구독 취소를 위한 정보 저장
    const queueName = `${socket.data.userId}_${generateRandomId()}`;
    socket.data.consumerTag = await subscribe(
        queueName,
        socket.data.userId,
        { durable: false, autoDelete: true },
        onMessageToUser,
    );
}
