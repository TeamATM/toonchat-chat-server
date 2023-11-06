/* eslint-disable import/prefer-default-export */
import { Service } from "typedi";
import { logger } from "../config";
import { CharacterModel } from "../repository";
import { CharacterDocument } from "../types";

@Service()
export class CharacterService {
    // eslint-disable-next-line arrow-body-style
    findCharacter = async (characterId: number) => {
        return CharacterModel.findOne<CharacterDocument>({ _id: characterId });
    };

    upsertCharacterInformation = async (character:CharacterDocument) => {
        const { _id, ...updateInfo } = character;
        try {
            logger.info(character, "Updating character information");
            return CharacterModel.findOneAndUpdate<CharacterDocument>({ _id }, updateInfo, { upsert: true });
        } catch (err) {
            logger.error({ err, character }, "Error occured while update character information.");
            return undefined;
        }
    };

    deleteCharacterInformation = async (character:CharacterDocument) => {
        try {
            logger.info(character, "Deleting character information...");
            // eslint-disable-next-line no-underscore-dangle
            return (await CharacterModel.deleteOne({ _id: character._id })).acknowledged;
        } catch (err) {
            logger.error({ err, character }, "Error occured while delete character information.");
            return undefined;
        }
    };
}
