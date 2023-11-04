import mongoose from "mongoose";
import { characterSchema } from "../schemas";
import { CharacterDocument } from "../../types";

export const CharacterModel = mongoose.model<CharacterDocument>("character", characterSchema);
