import mongoose from "mongoose";
import { historySchema } from "../schemas";
import { HistoryDocument } from "../../types";

export const HistoryModel = mongoose.model<HistoryDocument>("history", historySchema);
