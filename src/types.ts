import { Socket } from "socket.io";

export type TypeSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export interface ServerToClientEvents {
    subscribe: (message: MessageFromMQ) => void;
}

export interface ClientToServerEvents {
    publish: (message: string, characterId: number) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    username: string;
    role: string;
    consumerTag: string;
}

export interface MessageFromMQ {
    /**
     * TODO: status, characterName 빼기
     *       messageFrom, messageTo 이름 바꾸기
     */
    messageId:string,
    replyMessageId?:string,
    status?:string,
    content:string,
    messageFrom:number,
    messageTo:string,
    characterName:string,
    createdAt:Date,
}

export interface Message extends Document {
    _id: string,
    replyMessageId: string,
    content: string,
    userId: string,
    characterId: number,
    fromUser: boolean,
    createdAt: Date,
    /**
     * TODO: status 제거
     */
    status: String,
}


interface GenerationArgs {
    temperature: number,
    repetition_penalty: number,
}

interface CeleryArgs {
    /**
     * TODO: status, characterName 빼기
     *       messageFrom, messageTo 이름 바꾸기
     */
    history: Array<Message>,
    persona: string,
    userId: string,
    content: string,
    messageFrom: string,
    messageTo: string,
    characterName: string,
    generationArgs: GenerationArgs,
    status: string,
}

export interface MessageToMQ {
    id: string,
    task: string,
    args: [CeleryArgs, boolean]
    kwargs: Map<string, string>
}