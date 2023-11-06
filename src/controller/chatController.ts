/* eslint-disable class-methods-use-this */
import { RequestHandler } from "express";
import Container, { Inject, Service } from "typedi";
import { HistoryService } from "../service";
import { logger } from "../config";
import { StoredChat, HttpController } from "../types";
import { Controller, Get } from "../decorator/requestDefinition";
import { getClientIpAddress } from "../utils";
import { AuthenticationFilter, IpResolveFilter, LogFilter } from "../config/middleware";

@Controller("/chat", Container.get(LogFilter), Container.get(IpResolveFilter), Container.get(AuthenticationFilter))
@Service()
export class ChatController implements HttpController {
    @Inject()
    private historyService:HistoryService;

    @Get("/history/:id")
    getHistory:RequestHandler = async (req, res) => {
        const { id: characterId } = req.params;
        // const { date, limit } = req.query;
        const { userId } = req.data;

        try {
            const chatHistory = await this.historyService.getChatHistoryAll(userId, Number(characterId));
            const result = chatHistory.reduce((prev, cur) => {
                prev.push(...cur.messages);
                return prev;
            }, new Array<StoredChat>());

            return res.status(200).json(result);
        } catch (err) {
            logger.error({
                err, userId, characterId, remoteHost: getClientIpAddress(req), url: req.url,
            }, "failed to process fetch chat history");
            return res.status(500);
        }
    };

    @Get("/recent")
    getRecentChats:RequestHandler = async (req, res) => {
        try {
            const recentMessages = await this.historyService.getRecentChat(req.data.userId);
            return res.status(200).json(recentMessages);
        } catch (err) {
            logger.error({
                err, remoteHost: getClientIpAddress(req), url: req.url, userId: req.data.userId,
            });
            return res.status(500);
        }
    };
}
