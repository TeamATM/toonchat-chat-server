import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { decodeJwtToken } from "../jwt";
import { TypeSocket } from "../types";

export const authenticateSocket = (socket:TypeSocket, next: (err?: Error) => void) => {
    const token:string|undefined = socket.handshake.auth.token;

    try {
        const decodedToken = decodeJwtToken(token);
        if (typeof decodedToken.sub !== "string") {
            throw new JsonWebTokenError("Subject field is not defined"); 
        }
        socket.data.username =  decodedToken.sub;
        next();
    } catch (err) {
        if (err instanceof TokenExpiredError){
            // TODO: Do something?
        }
        // 실패시 소켓 연결 종료
        console.log("Authentication failed:", err);
        socket.disconnect(true);
        next(new Error("Authentication failed"));
    }
}