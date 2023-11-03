import { ObjectId } from "mongoose";
import { Message } from ".";

export interface HistoryDocument extends Document {
    _id: ObjectId;
    userId: string;
    characterId: number;
    messages: Message[];
}
