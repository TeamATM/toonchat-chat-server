import mongoose from "mongoose";
import { embeddingSchema } from "../schemas";
import { EmbeddingDocument } from "../types";

export const EmbeddingModel = mongoose.model<EmbeddingDocument>("embedding", embeddingSchema);
