import mongoose from "mongoose";
import { chatSchema } from "../schemas";
import { ChatDocument } from "../../types";

export const ChatModel = mongoose.model<ChatDocument>("message", chatSchema);
