/* eslint-disable import/prefer-default-export */
import { logger } from "../logging";
import { CharacterModel } from "../models";
import { CharacterDocument } from "../types";

export async function getCharacterPersona(characterId: number) {
    try {
        return await CharacterModel.findOne<CharacterDocument>({ _id: characterId }) || undefined;
    } catch (err) {
        logger.error({ err, characterId }, "Error occured while fetch character persona.");
        return undefined;
    }
}

export async function upsertCharacterInformation(character:CharacterDocument) {
    const { _id, ...updateInfo } = character;
    try {
        logger.info(character, "character information updated");
        return CharacterModel.findOneAndUpdate<CharacterDocument>({ _id }, updateInfo, { upsert: true });
    } catch (err) {
        logger.error({ err, character }, "Error occured while update character information.");
        return undefined;
    }
}

export async function deleteCharacterInformation(character:CharacterDocument) {
    try {
        logger.info(character, "character information deleted");
        // eslint-disable-next-line no-underscore-dangle
        return (await CharacterModel.deleteOne({ _id: character._id })).acknowledged;
    } catch (err) {
        logger.error({ err, character }, "Error occured while delete character information.");
        return undefined;
    }
}
