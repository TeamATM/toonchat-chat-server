import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { isTokenExist } from "./redis/redis";
import logger from "./logger";

const secret = process.env.SECRET || "secret";

export function validateAndDecodeJwtToken(token:string|undefined) {
    // token 존재 확인
    if (token === undefined) {
        logger.warn("Token is not given");
        throw new JsonWebTokenError("Token is not given");
    }

    // redis에 토큰 존재하는지 확인
    const tokenExistInRedis = isTokenExist(token);
    if (!tokenExistInRedis) {
        logger.warn("Token has been expired");
        throw new JsonWebTokenError("Token has been expired");
    }

    const decodedToken = jwt.verify(token, secret);
    return decodedToken;
}

export function getUsername(token?:string) {
    const decodedToken = validateAndDecodeJwtToken(token);

    return decodedToken.sub as string;
}
