/* eslint-disable no-unused-vars */

export interface Chat {
    fromUser: boolean;
    content: string;
}

export interface ChatFromClient {
    content: string;
    characterId: number;
}

export interface ChatToClient extends Chat {
    messageId: string;
    characterId: number;
    createdAt: Date;
}

export interface ErrorToClient {
    content: string;
}

export interface ServerToClientEvents {
    subscribe: (message: ChatToClient) => void;
    error: (message: ErrorToClient) => void;
}

export interface ClientToServerEvents {
    publish: (message: ChatFromClient) => void;
}
