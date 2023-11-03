import { ObjectId } from "mongoose";
import { Message } from ".";

export interface MessageDocument extends Document {
    _id: ObjectId;
    userId: string;
    characterId: number;
    date: Date;
    messages: Message[];
}
