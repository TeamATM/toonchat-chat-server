import mongoose from "mongoose";
import { Message } from "../message_queue/types";
import { messageSchema } from "./schema";

// eslint-disable-next-line import/prefer-default-export
export const MessageModel = mongoose.model<Message>("message", messageSchema);
