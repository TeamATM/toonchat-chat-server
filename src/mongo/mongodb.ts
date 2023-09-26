import mongoose, { PipelineStage, Types } from "mongoose";
import { Message } from "amqplib";
import { EmbeddingModel, MessageModel, PersonaModel } from "./model";
import { Chat, MessageFromMQ } from "../message_queue/types";
import logger from "../logger";
import { EmbeddingDocument, PersonaDocument } from "./schema";

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
    embedding?: Array<number>,
) {
    const document = new MessageModel({
        _id: new Types.ObjectId(replyMessageId),
        replyMessageId: fromUser ? new Types.ObjectId() : undefined,
        content: message,
        fromUser,
        userId,
        characterId,
        createdAt: new Date(),
        embeddingVector: embedding || undefined,
    });

    return document.save();
}

// eslint-disable-next-line max-len
export function saveUserMessage(userId:string, characterId:number, message:string, embedding?:number[]) {
    return saveMessage(userId, characterId, message, true, undefined, embedding);
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
}

export async function getCharacterPersona(characterId: number) {
    const persona = await PersonaModel.findOne<PersonaDocument>(
        // eslint-disable-next-line object-shorthand, func-names
        { $where: function () { return this.characterId === characterId; } },
    );

    return persona || undefined;
}

export async function findSimilarDocuments(embeddingVector?:Array<number>) {
    if (!embeddingVector) return undefined;

    const pipeline:PipelineStage[] = [
        {
            $search: {
                index: "embeddingIndex",
                knnBeta: {
                    vector: embeddingVector,
                    path: "embeddingVector",
                    k: 3,
                },
            },
        },
    ];

    try {
        return await EmbeddingModel.aggregate<EmbeddingDocument>(pipeline).exec();
    } catch (err) {
        logger.fatal(err, "failed to perform vector search");
        return [];
    }
}
