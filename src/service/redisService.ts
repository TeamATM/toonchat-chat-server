import { findHistoryByUserIdAndCharacterId } from "./historyService";

export function isTokenExist(token: string|undefined): boolean {
    return !!token;
}

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
export async function existMessageInProcess(userId: string, characterId: number) {
    const history = await findHistoryByUserIdAndCharacterId(userId, characterId);
    if (history === null || history.messages.length === 0 || history.messages.at(-1)?.fromUser === false) return false;

    return new Date().getTime() - history.messages.at(-1)!.createdAt.getTime() < 5000;
}
