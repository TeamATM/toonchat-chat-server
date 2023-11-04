import { Router } from "express";
import { getChatHistoryAll, getRecentChat } from "../../service";
import { logger } from "../../config";
import { Message } from "../../types";
import { getClientIpAddress } from "../../utils";

export const chatRouter = Router();

chatRouter.get("/history/:id", async (req, res) => {
    const { id: characterId } = req.params;
    // const { date, limit } = req.query;
    const { userId } = req.data;

    try {
        const chatHistory = await getChatHistoryAll(userId, Number(characterId));
        const result = chatHistory.reduce((prev, cur) => {
            prev.push(...cur.messages);
            return prev;
        }, new Array<Message>());

        return res.status(200).json(result);
    } catch (err) {
        logger.error({
            err, userId, characterId, remoteHost: getClientIpAddress(req), url: req.url,
        }, "failed to process fetch chat history");
        return res.status(500);
    }
});

chatRouter.get("/recent", async (req, res) => {
    try {
        const recentMessages = await getRecentChat(req.data.userId);
        return res.status(200).json(recentMessages);
    } catch (err) {
        logger.error({
            err, remoteHost: getClientIpAddress(req), url: req.url, userId: req.data.userId,
        });
        return res.status(500);
    }
});
