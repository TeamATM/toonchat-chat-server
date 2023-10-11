import logger from "../logger";
import { getCharacterPersona, existMessageInProcess } from "../service";
import { MessageFromClient } from "./types";
import { InvalidRequestError } from "../exception";
import { maxMessageLength } from "./connectionHandler";

export async function checkCanRequest(userId: string, characterId: number, content: string) {
    // 글자수 제한
    if (!content || content.length > maxMessageLength) {
        const msg = "Message is empty or too long";
        logger.warn({ userId, characterId, content }, msg);
        throw new InvalidRequestError(msg);
    }

    // 한 계정당 동시 요청 가능 개수 제한
    if (await existMessageInProcess(userId)) {
        const msg = "아직 처리중인 메시지가 있습니다. 이전 요청이 처리된 이후에 다시 시도하세요";
        logger.warn({ userId, characterId, content }, msg);
        throw new InvalidRequestError(msg);
    }
}

export async function checkValidCharacterIdAndGetPersona(data: MessageFromClient, userId: string) {
    const persona = await getCharacterPersona(data.characterId);
    if (persona === undefined) {
        const msg = "Invalid characterId";
        logger.error({ userId, ...data }, "Invalid characterId");
        throw new InvalidRequestError(msg);
    }
    return persona;
}
