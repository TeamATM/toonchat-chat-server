export interface Chat {
    fromUser: boolean;
    content: string;
}

// 디비에 저장할 정보
export interface Message extends Document, Chat {
    _id: string;
    replyMessageId: string;
    userId: string;
    characterId: number;
    createdAt: Date;
}

interface GenerationArgs {
    temperature: number;
    repetition_penalty: number;
}

interface DataForPrompt {
    userId: string;
    persona: string;
    history: Array<Chat>;
    content: string;
    generationArgs: GenerationArgs;
}

export interface MessageFromMQ extends Chat {
    messageId: string;
    userId: string;
    characterId: number;
    createdAt: Date;
}

export interface MessageToMQ {
    id: string;
    task: string;
    args: [DataForPrompt, boolean];
    kwargs: Map<string, string>;
}
