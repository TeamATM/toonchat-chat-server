import { searchSimilarDocuments } from "../../service/embeddingService";
import { updateHistory, updateMessage } from "../../service";
import { checkCanRequest, getCharacter } from "./validator";
import { MessageFromClient, TypeSocket, Message } from "../../types";
import {
    buildEchoMessage, buildInferenceMessage,
    buildUserMessage, publish,
} from "../../message_queue";

export async function handleOnPublishMessage(socket: TypeSocket, data: MessageFromClient) {
    const { userId } = socket.data;
    const character = await checkCanRequest(userId, data.characterId, data.content)
        .then(() => getCharacter(data.characterId));

    const msg: Message = buildUserMessage(data.content);
    updateMessage(userId, data.characterId, msg).then(() => {
        const echoMessage = buildEchoMessage(msg, data.characterId);
        publish("amq.topic", userId, echoMessage);
    });

    // 몽고디비 연결해서 메시지 저장 & 이전 대화내역 가져오기 => 메시지큐 전달
    const [history, vectorSearchResult] = await Promise.all([
        updateHistory(userId, data.characterId, msg),
        searchSimilarDocuments(data.content),
    ]);

    const inferenceMessage = buildInferenceMessage(history, character, vectorSearchResult);
    publish("celery", "celery", inferenceMessage);
}
