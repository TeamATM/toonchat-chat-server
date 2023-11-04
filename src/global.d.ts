export {};

declare global {
    namespace Express {
        interface Request {
            data: {
                userId: string,
                remoteAddress: string,
            }
        }
    }
}
