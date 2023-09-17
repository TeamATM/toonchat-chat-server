import { Router } from "express";
import { getChatHistoryAll, getRecentChat } from "../mongo/mongodb";

const router = Router();

router.get("/history/:id", async (req, res) => {
    const { id: characterId } = req.params;
    const userId = req.userId!;

    const chatHistory = await getChatHistoryAll(userId, Number(characterId));

    return res.status(200).json(chatHistory);
});

router.get("/recent", async (req, res) => {
    const recentMessages = await getRecentChat(req.userId!);
    return res.status(200).json(recentMessages);
});

export default router;
