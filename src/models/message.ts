import mongoose from "mongoose";
import { messageSchema } from "../schemas";
import { MessageDocument } from "../types";

export const MessageModel = mongoose.model<MessageDocument>("message", messageSchema);
