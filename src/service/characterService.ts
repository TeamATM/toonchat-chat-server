/* eslint-disable import/prefer-default-export */
import logger from "../logger";
import { CharacterModel, CharacterDocument } from "../mongo";

export async function getCharacterPersona(characterId: number) {
    try {
        return await CharacterModel.findOne<CharacterDocument>({ _id: characterId }) || undefined;
    } catch (err) {
        logger.error({ err, characterId }, "Error occured while fetch character persona.");
        return undefined;
    }
}
