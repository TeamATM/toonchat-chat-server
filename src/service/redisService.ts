import { Inject, Service } from "typedi";
import { HistoryService } from "./historyService";

@Service()
export class RedisService {
    @Inject()
    historyService:HistoryService;

    isTokenExist = (token: string|undefined): boolean => !!token;

    existMessageInProcess = async (userId: string, characterId: number) => {
        const history = await this.historyService.findHistoryByUserIdAndCharacterId(userId, characterId);
        if (history === null
            || history.messages.length === 0
            || history.messages.at(-1)?.fromUser === false
        ) return false;

        return new Date().getTime() - history.messages.at(-1)!.createdAt.getTime() < 5000;
    };
}
