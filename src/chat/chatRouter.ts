import { Router } from "express";
import { getChatHistoryAll, getRecentChat } from "../mongo/mongodb";
import logger from "../logger";
import { Message } from "../message_queue/types";

const router = Router();

router.get("/history/:id", async (req, res) => {
    const { id: characterId } = req.params;
    // const { date, limit } = req.query;
    const userId = req.userId!;

    try {
        const chatHistory = await getChatHistoryAll(userId, Number(characterId));
        const result = chatHistory.reduce((prev, cur) => {
            prev.push(...cur.messages);
            return prev;
        }, new Array<Message>());

        return res.status(200).json(result);
    } catch (err) {
        logger.error({
            err, userId, characterId, remoteHost: req.ip, url: req.url,
        }, "failed to process fetch chat history");
        return res.status(500);
    }
});

router.get("/recent", async (req, res) => {
    try {
        const recentMessages = await getRecentChat(req.userId!);
        return res.status(200).json(recentMessages);
    } catch (err) {
        logger.error({
            err, remoteHost: req.ip, url: req.url, userId: req.userId,
        });
        return res.status(500);
    }
});

export default router;
