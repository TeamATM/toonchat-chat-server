export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    userId: string;
    role: string;
    consumerTag: string;
    remoteAddress: string;
}
