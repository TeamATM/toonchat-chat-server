import { config } from "dotenv";
import { Service } from "typedi";

@Service()
export class EnvConfig {
    port;

    corsAllowOrigin;

    logLevel;

    jwtSecret;

    ampqUri;

    mongoUri;

    openaiApiKey;

    maxMessageLength;

    chatHistoryLength;

    maxReferenceLength;

    profile;

    constructor() {
        config();

        this.port = Number(process.env.PORT);
        this.corsAllowOrigin = process.env.CORS_ALLOW_ORIGIN!;
        this.logLevel = process.env.LOG_LEVEL!;
        this.jwtSecret = process.env.SECRET!;
        this.ampqUri = process.env.AMQP_URL!;
        this.mongoUri = process.env.MONGODB_URI!;
        this.openaiApiKey = process.env.OPENAI_API_KEY!;
        this.maxMessageLength = Number(process.env.MAX_MESSAGE_LENGTH);
        this.chatHistoryLength = Number(process.env.CHAT_HISTORY_LENGTH);
        this.maxReferenceLength = Number(process.env.MAX_REFERENCE_LENGTH);
        this.profile = process.env.PROFILE!;
    }
}
