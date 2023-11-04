/* eslint-disable import/prefer-default-export */
import { logger } from "../config";
import { CharacterModel } from "../mongo";
import { CharacterDocument } from "../types";

export async function findCharacter(characterId: number) {
    return CharacterModel.findOne<CharacterDocument>({ _id: characterId });
}

export async function upsertCharacterInformation(character:CharacterDocument) {
    const { _id, ...updateInfo } = character;
    try {
        logger.info(character, "Updating character information");
        return CharacterModel.findOneAndUpdate<CharacterDocument>({ _id }, updateInfo, { upsert: true });
    } catch (err) {
        logger.error({ err, character }, "Error occured while update character information.");
        return undefined;
    }
}

export async function deleteCharacterInformation(character:CharacterDocument) {
    try {
        logger.info(character, "Deleting character information...");
        // eslint-disable-next-line no-underscore-dangle
        return (await CharacterModel.deleteOne({ _id: character._id })).acknowledged;
    } catch (err) {
        logger.error({ err, character }, "Error occured while delete character information.");
        return undefined;
    }
}
