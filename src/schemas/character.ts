import { Schema } from "mongoose";
import { CharacterDocument } from "../types";

export const characterSchema = new Schema<CharacterDocument>({
    _id: Number,
    characterName: String,
    profileImageUrl: String,
    backgroundImageUrl: String,
    statusMessage: String,
    hashTag: String,
    persona: (Array<string>),
});
