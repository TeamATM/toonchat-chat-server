import mongoose, { PipelineStage, Types } from "mongoose";
import {
    EmbeddingModel, HistoryModel, MessageModel, PersonaModel,
} from "./model";
import { Message, MessageFromMQ } from "../message_queue/types";
import logger from "../logger";
import { getCurrentDate, getEmbedding } from "../utils";
import {
    EmbeddingDocument, HistoryDocument, MessageDocument, PersonaDocument,
} from "./types";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";
const historyLength = Number(process.env.CHAT_HISTORY_LENGTH) || 10;

const connectionOptions: mongoose.ConnectOptions = {
    maxPoolSize: 100, // 100 is default value
    autoIndex: false,
    dbName: "test2",
};

export const connectToMongo = () => {
    mongoose.connect(uri, connectionOptions)
        .then(async (v) => {
            logger.info("Connected to MongoDB");
            v.connection.on("errer", (err) => { logger.fatal(err, "failed to connect Mongo"); });
        })
        .catch((err) => { throw err; });
};

function updateMessage(userId: string, characterId: number, today: Date, msg: Message) {
    // Start of day
    const startDay = getCurrentDate(today);

    return MessageModel.updateOne<MessageDocument>(
        { userId, characterId, date: startDay },
        {
            $push: {
                messages: msg,
            },
        },
        { upsert: true },
    ).exec();
}

async function updateHistory(userId: string, characterId: number, msg: Message) {
    return HistoryModel.findOneAndUpdate<HistoryDocument>(
        { userId, characterId },
        {
            $push: {
                messages: {
                    $each: [msg],
                    $slice: -historyLength,
                },
            },
        },
        { upsert: true, new: true },
    );
}

async function saveMessage(
    userId:string,
    characterId:number,
    message:string,
    fromUser:boolean,
    replyMessageId?:string,
) {
    const today = new Date();
    const msg:Message = {
        messageId: new Types.ObjectId(replyMessageId),
        replyMessageId: new Types.ObjectId(),
        fromUser,
        content: message,
        createdAt: today,
    };

    // push message into collection of today by user and character
    // execute it asyncronously without wait, since the result have any dependency
    updateMessage(userId, characterId, today, msg);

    // update recent chat history and get updated result
    try {
        const history = await updateHistory(userId, characterId, msg);
        return history;
    } catch (err) {
        logger.error(err);
        return undefined;
    }
}

export async function saveUserMessage(userId:string, characterId:number, message:string) {
    try {
        return saveMessage(userId, characterId, message, true, undefined);
    } catch (err) {
        logger.error(err);
        return undefined;
    }
}

export async function saveBotMessage(messageFromMQ:MessageFromMQ) {
    const {
        userId, characterId, content, messageId, fromUser,
    } = messageFromMQ;

    if (fromUser) return undefined;

    logger.info({ userId, characterId, msg: content });
    logger.debug(messageFromMQ);

    try {
        return saveMessage(userId, characterId, content, false, messageId);
    } catch (err) {
        logger.error(err);
        return undefined;
    }
}

async function getChatHistoryLtDate(userId:string, characterId:number, dateBefore: Date, limit?: number) {
    let query = MessageModel.find<MessageDocument>({ userId, characterId, date: { $lt: dateBefore } });
    if (limit) query = query.limit(limit);

    return query.exec();
}

export async function getChatHistoryAll(userId:string, characterId:number) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getChatHistoryLtDate(userId, characterId, tomorrow);
}

export async function getChatHistoryOfDay(userId:string, characterId:number, day:Date) {
    day.setHours(23, 59, 59, 999);
    return getChatHistoryLtDate(userId, characterId, day, 1);
}

export async function getRecentChat(userId:string) {
    try {
        const recentMessages = HistoryModel.aggregate([
            { $match: { userId } },
            { $unwind: "$messages" },
            {
                $group: {
                    _id: "$characterId",
                    lastMessage: { $last: "$messages" },
                },
            },
            {
                $project: {
                    _id: 0,
                    characterId: "$_id",
                    lastMessage: 1,
                },
            },
        ]).exec();

        return recentMessages;
    } catch (err) {
        logger.fatal(err, `failed to get recent chat of user: ${userId}`);
        return undefined;
    }
}

export async function getCharacterPersona(characterId: number) {
    const persona = await PersonaModel.findOne<PersonaDocument>({ _id: characterId });

    return persona || undefined;
}

// eslint-disable-next-line no-underscore-dangle
export async function _findSimilarDocuments(vector:number[]) {
    const pipeline:PipelineStage[] = [
        {
            $search: {
                index: "embeddingIndex",
                knnBeta: {
                    vector,
                    path: "embeddingVector",
                    k: 3,
                },
            },
        },
    ];

    try {
        return await EmbeddingModel.aggregate<EmbeddingDocument>(pipeline);
    } catch (err) {
        logger.fatal(err, "failed to perform vector search");
        return undefined;
    }
}

export async function findSimilarDocuments(userInput:string) {
    const embeddingVector = await getEmbedding(userInput);
    if (!embeddingVector) return undefined;

    return _findSimilarDocuments(embeddingVector);
}
