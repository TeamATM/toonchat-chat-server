import mongoose from "mongoose";
import { MessageModel } from "./model";
import { v4 as uuidv4 } from "uuid";
import { MessageFromMQ } from "../types";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";

const connectionOptions: mongoose.ConnectOptions = {
    maxPoolSize: 100, // 100 is default value
    autoIndex: false,
    dbName: "test2",
}

export const connectToMongo = () => {
    mongoose.connect(uri, connectionOptions).
        then(async v => {
            console.log("Connected to MongoDB");
            // console.log(await ViewModel.findOne({}))
            // console.log(await MessageModel.findOne({}))
            v.connection.on("errer", err => {console.error(err)})
        }).
        catch(console.error);
}

function saveMessage(userId:string, characterId:number, message:string, fromUser:boolean, messageId?:string, status?:string) {
    const document = new MessageModel({
        _id: messageId || uuidv4(),
        replyMessageId: fromUser ? uuidv4() : undefined,
        content: message,
        fromUser,
        userId,
        characterId,
        createdAt: new Date(),
        status
    });
    
    return document.save();
}

export function saveUserMessage(userId:string, characterId:number, message:string) {
    return saveMessage(userId, characterId, message, true, undefined, "STARTED");
}

export function saveBotMessage(messageFromMQ:MessageFromMQ) {
    return saveMessage(messageFromMQ.messageTo, messageFromMQ.messageFrom, messageFromMQ.content, false, messageFromMQ.messageId, "FINISHED")
}

export async function getChatHistory(userId:string, characterId:number) {
    try {
        const aggregateResult = await MessageModel.aggregate([
            {$match: {userId, characterId}},
            {$sort: {createdAt: -1}},
            {$limit: 10}
        ]).exec();

        return aggregateResult.reverse();
    } catch (err) {
        console.error(err);
        return [];
    }
}