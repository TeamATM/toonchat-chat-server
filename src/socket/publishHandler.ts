import { MongooseError } from "mongoose";
import { logger } from "../logging";
import { searchSimilarDocuments } from "../utils";
import { updateHistory, updateMessage } from "../service";
import { checkCanRequest, checkValidCharacterIdAndGetPersona } from "./validator";
import {
    MessageFromClient, EmbeddingDocument, HistoryDocument,
    CharacterDocument, TypeSocket, Message,
} from "../types";
import {
    buildEchoMessage, buildInferenceMessage,
    buildUserMessage, publish,
} from "../message_queue";

export async function handleOnPublishMessage(socket: TypeSocket, data: MessageFromClient) {
    const { username: userId } = socket.data;
    let persona: CharacterDocument;

    try {
        await checkCanRequest(userId, data.characterId, data.content);
        persona = await checkValidCharacterIdAndGetPersona(data, userId);
    } catch (err) {
        if (err instanceof Error) socket.emit("error", { content: err.message });
        else logger.fatal(err, "Unhandled Exception");
        return;
    }

    const msg: Message = buildUserMessage(data.content);

    updateMessage(userId, data.characterId, msg).then(() => {
        publish("amq.topic", userId, buildEchoMessage(msg, data.characterId));
    });

    // 몽고디비 연결해서 메시지 저장 & 이전 대화내역 가져오기 => 메시지큐 전달
    Promise.all([
        updateHistory(userId, data.characterId, msg),
        searchSimilarDocuments(data.content),
    ]).then((result) => {
        publishInferenceRequestMessage(result, userId, persona);
    }).catch((err) => { logger.error(err); });
}

function publishInferenceRequestMessage(
    promiseResult: [HistoryDocument?, EmbeddingDocument[]?],
    userId: string,
    persona: CharacterDocument,
) {
    const [history, vectorSearchResult] = promiseResult;
    if (history === undefined) {
        logger.error("history is undefined");
        throw new MongooseError("history is undefined");
    }

    logger.trace({ userId, characterId: history.characterId, msg: history });
    logger.debug(history, "history of user: {}", userId);

    // publish for inference
    publish("celery", "celery", buildInferenceMessage(history, persona, vectorSearchResult));
}
