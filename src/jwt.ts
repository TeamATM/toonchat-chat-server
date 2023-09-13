import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { isTokenExist } from "./redis";

const secret = process.env.SECRET || "secret";

export default function decodeJwtToken(token:string|undefined) {
    // token 존재 확인
    if (token === undefined) {
        console.log("Token is not given");
        throw new JsonWebTokenError("Token is not given");
    }

    // redis에 토큰 존재하는지 확인
    const tokenExistInRedis = isTokenExist(token);
    if (!tokenExistInRedis) {
        console.log("Token has been expired");
        throw new JsonWebTokenError("Token has been expired");
    }

    const decodedToken = jwt.verify(token, secret);
    return decodedToken;
}
