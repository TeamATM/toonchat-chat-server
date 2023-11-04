import { InvalidRequestError } from "../../exceptions/exception";
import { maxMessageLength } from "./connectionHandler";
import { findCharacter, existMessageInProcess } from "../../service";

export async function checkCanRequest(userId: string, characterId: number, content: string) {
    // 글자수 제한
    if (!content || content.length > maxMessageLength) {
        const msg = "Message is empty or too long";
        throw new InvalidRequestError(msg);
    }

    // 한 계정당 동시 요청 가능 개수 제한
    if (await existMessageInProcess(userId, characterId)) {
        const msg = "아직 처리중인 메시지가 있습니다. 이전 요청이 처리된 이후에 다시 시도하세요";
        throw new InvalidRequestError(msg);
    }
}

export async function getCharacter(characterId: number) {
    const character = await findCharacter(characterId);
    if (!character) {
        throw new InvalidRequestError("Invalid characterId");
    }
    return character;
}
