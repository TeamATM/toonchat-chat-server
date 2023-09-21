import mongoose, { Types } from "mongoose";
import { Message } from "amqplib";
import { MessageModel } from "./model";
import { Chat, MessageFromMQ } from "../message_queue/types";
import logger from "../logger";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";

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

function saveMessage(
    userId:string,
    characterId:number,
    message:string,
    fromUser:boolean,
    replyMessageId?:string,
) {
    const document = new MessageModel({
        _id: new Types.ObjectId(replyMessageId),
        replyMessageId: fromUser ? new Types.ObjectId() : undefined,
        content: message,
        fromUser,
        userId,
        characterId,
        createdAt: new Date(),
    });

    return document.save();
}

export function saveUserMessage(userId:string, characterId:number, message:string) {
    return saveMessage(userId, characterId, message, true);
}

export function saveBotMessage(messageFromMQ:MessageFromMQ) {
    const {
        userId, characterId, content, messageId, fromUser,
    } = messageFromMQ;

    if (fromUser) return Promise.resolve(null);

    logger.info({ userId, characterId, msg: content });
    logger.debug(messageFromMQ);

    return saveMessage(userId, characterId, content, false, messageId);
}

async function getChatHistory(userId:string, characterId:number, limit:number = 0) {
    try {
        const pipe = MessageModel.aggregate([
            { $match: { userId, characterId } },
            { $sort: { createdAt: -1 } },
        ]);
        if (limit > 0) pipe.append({ $limit: limit }, { $project: { content: 1, fromUser: 1 } });

        const aggregateResult = await pipe.exec();
        return aggregateResult.reverse();
    } catch (err) {
        logger.fatal(err, `Failed to get history of user: ${userId}, character: ${characterId}`);
        return [];
    }
}

export function getChatHistoryAll(userId:string, characterId:number):Promise<Message[]> {
    return getChatHistory(userId, characterId);
}

// eslint-disable-next-line max-len
export function getChatHistoryByLimit(userId:string, characterId:number, limit:number):Promise<Chat[]> {
    if (limit <= 0) return Promise.resolve([]);
    return getChatHistory(userId, characterId, limit);
}

export async function getRecentChat(userId:string) {
    try {
        const recentMessages = MessageModel.aggregate([
            { $match: { userId } },
            { $sort: { _id: -1 } },
            { $project: { userId: 0, __v: 0 } },
            {
                $group: {
                    _id: "$characterId",
                    // recentMessages: { $firstN: {}}
                    recentMessages: { $first: "$$ROOT" },
                },
            },
        ]).exec();

        return recentMessages;
    } catch (err) {
        logger.fatal(err, `failed to get recent chat of user: ${userId}`);
        return null;
    }
    /**
    [
        {
            _id: 0,
            recentMessages: {
            _id: new ObjectId("6506c32143852e0fca0bbb17"),
            content: 'this is a message from botId: 0',
            characterId: 0,
            fromUser: false,
            createdAt: 2023-09-17T09:13:05.841Z
            }
        },
        {
            _id: 1,
            recentMessages: {
            _id: new ObjectId("6506b58006d4f37377a7dafd"),
            content: 'this is a message from botId: 1',
            characterId: 1,
            fromUser: false,
            createdAt: 2023-09-17T08:14:56.736Z
            }
        }
    ]
     */
}
