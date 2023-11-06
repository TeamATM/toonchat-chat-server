import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { Service } from "typedi";
import { RedisService } from "../service";
import { EnvConfig, logger } from "../config";

@Service()
export class JwtUtil {
    private secret;

    // eslint-disable-next-line no-unused-vars
    constructor(private redisService:RedisService, envConfig:EnvConfig) {
        this.secret = envConfig.jwtSecret;
    }

    validateAndDecodeJwtToken = (token:string|undefined) => {
        // token 존재 확인
        this.validateToken(token);

        const decodedToken = jwt.verify(token!, this.secret);
        return decodedToken;
    };

    getUsername = (token?:string) => {
        const decodedToken = this.validateAndDecodeJwtToken(token);

        return decodedToken.sub as string;
    };

    private validateToken = (token: string | undefined) => {
        if (token === undefined) {
            logger.warn("Token is not given");
            throw new JsonWebTokenError("Token is not given");
        }

        // redis에 토큰 존재하는지 확인
        const tokenExistInRedis = this.redisService.isTokenExist(token);
        if (!tokenExistInRedis) {
            logger.warn("Token has been expired");
            throw new JsonWebTokenError("Token has been expired");
        }
    };
}
