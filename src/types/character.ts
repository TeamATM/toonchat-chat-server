export interface CharacterDocument extends Document {
    _id: number;
    characterName: string;
    profileImageUrl: string;
    backgroundImageUrl: string;
    statusMessage: string;
    hashTag: string;
    persona: string[];
}
