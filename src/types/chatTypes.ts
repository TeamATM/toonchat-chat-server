/* eslint-disable no-unused-vars */

export interface Chat {
    fromUser: boolean;
    content: string;
}

export interface MessageFromClient {
    content: string;
    characterId: number;
}

export interface MessageToClient extends Chat {
    messageId: string;
    characterId: number;
    createdAt: Date;
}

export interface ErrorToClient {
    content: string;
}

export interface ServerToClientEvents {
    subscribe: (message: MessageToClient) => void;
    error: (message: ErrorToClient) => void;
}

export interface ClientToServerEvents {
    publish: (message: MessageFromClient) => void;
}
