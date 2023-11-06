import { Service } from "typedi";
import axios from "axios";
import { EmbeddingRequestError } from "../exceptions";
import { EnvConfig } from "../config";

@Service()
export class EmbeddingService {
    private embeddingEndpoint;

    private embeddingApiKey;

    constructor(envConfig:EnvConfig) {
        this.embeddingEndpoint = "https://api.openai.com/v1/embeddings";
        this.embeddingApiKey = envConfig.openaiApiKey;
    }

    getEmbedding = async (query: string) => {
        // openai embedding 사용
        const response = await axios.post(this.embeddingEndpoint, {
            input: query,
            model: "text-embedding-ada-002",
        }, {
            headers: {
                Authorization: `Bearer ${this.embeddingApiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 1000, // 1s
        });

        if (response.status !== 200) {
            throw new EmbeddingRequestError("요청을 처리하던 중 오류가 발생하였습니다.");
        }

        return response.data.data[0].embedding as Array<number>;
    };
}
