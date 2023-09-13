import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
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
            // console.log(await ViewModel.findOne({}))
            // console.log(await MessageModel.findOne({}))
            v.connection.on("errer", (err) => { console.error(err); });
        })
        .catch(console.error);
};

function saveMessage(
    userId:string,
    characterId:number,
    message:string,
    fromUser:boolean,
    messageId?:string,
) {
    const document = new MessageModel({
        _id: messageId || uuidv4(),
        replyMessageId: fromUser ? uuidv4() : undefined,
        content: message,
        fromUser,
        userId,
        characterId,
        createdAt: new Date(),
    });

    return document.save();
}

export function saveUserMessage(userId:string, characterId:number, message:string) {
    return saveMessage(userId, characterId, message, true, undefined);
}

export function saveBotMessage(messageFromMQ:MessageFromMQ) {
    const {
        userId, characterId, content, messageId,
    } = messageFromMQ;

    return saveMessage(userId, characterId, content, false, messageId);
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
