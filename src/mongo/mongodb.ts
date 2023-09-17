import mongoose, { Types } from "mongoose";
import { MessageModel } from "./model";
import { Chat, MessageFromMQ } from "../message_queue/types";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";

const connectionOptions: mongoose.ConnectOptions = {
    maxPoolSize: 100, // 100 is default value
    autoIndex: false,
    dbName: "test2",
};

export const connectToMongo = () => {
    mongoose.connect(uri, connectionOptions)
        .then(async (v) => {
            console.log("Connected to MongoDB");
            v.connection.on("errer", (err) => { console.error(err); });
        })
        .catch(console.error);
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

    console.log(messageFromMQ);

    return fromUser
        ? Promise.resolve(null) : saveMessage(userId, characterId, content, false, messageId);
}

export async function getChatHistory(userId:string, characterId:number) {
    try {
        const aggregateResult:Chat[] = await MessageModel.aggregate([
            { $match: { userId, characterId } },
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            { $project: { content: 1, fromUser: 1 } },
        ]).exec();

        return aggregateResult.reverse();
    } catch (err) {
        console.error(err);
        return [];
    }
}
