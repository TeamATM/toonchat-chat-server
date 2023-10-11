/* eslint-disable import/prefer-default-export */
import logger from "../logger";
import { PersonaModel, PersonaDocument } from "../mongo";

export async function getCharacterPersona(characterId: number) {
    try {
        return await PersonaModel.findOne<PersonaDocument>({ _id: characterId }) || undefined;
    } catch (err) {
        logger.error({ err, characterId }, "Error occured while fetch character persona.");
        return undefined;
    }
}
