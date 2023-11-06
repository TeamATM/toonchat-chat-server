/* eslint-disable no-unused-vars */
import { ConsumeMessage } from "amqplib";
import { MongooseError } from "mongoose";
import Container, { Service } from "typedi";
import { logger } from "../config";
import { generateRandomId } from "../utils";
import { RabbitTemplate } from "../repository";
import {
    CharacterDocument,
    CharacterUpdateMessage, ConsumeMessageCallback,
    StoredChat, ChatFromClient, MessageFromInferenceServer,
    ChatToClient, EmbeddingDocument, HistoryDocument, MessageToInferenceServer,
} from "../types";
import {
    ChatService, HistoryService,
    CharacterService, ChatRoomService, VectorSearchService,
} from ".";

@Service()
export class RabbitService {
    private chatRoomService;

    constructor(
        private rabbitTemplate:RabbitTemplate,
        private historyService:HistoryService,
        private characterService:CharacterService,
        private chatService:ChatService,
        private vectorSearchService:VectorSearchService,
    ) {
        this.chatRoomService = Container.get(ChatRoomService);
        this.registDefaultListener();
        this.registCharacterUpdateEventListener();
    }

    saveAndPublishEchoMessage = (data: ChatFromClient, userId: string) => {
        const msg = this.chatService.updateUserChat(userId, data.characterId, data.content);

        const echoMessage = buildEchoMessage(msg, data.characterId);
        this.rabbitTemplate.publish("amq.topic", userId, echoMessage)
            .catch((err) => {
                this.chatRoomService.sendEventToRoom(userId, "error", { content: "요청 처리에 실패하였습니다. 다시 시도해주세요." });
                logger.error(err, "failed to publish");
            });
        return msg;
    };

    publishInferenceRequestMessage = async (
        userId: string,
        data: ChatFromClient,
        msg: StoredChat,
        character: CharacterDocument,
    ) => {
        const [history, vectorSearchResult] = await Promise.all([
            this.historyService.updateHistory(userId, data.characterId, msg),
            this.vectorSearchService.searchSimilarDocuments(data.content),
        ]);

        const inferenceMessage = buildInferenceMessage(history, character, vectorSearchResult);
        this.rabbitTemplate.publish("celery", "celery", inferenceMessage)
            .catch((err) => {
                this.chatRoomService.sendEventToRoom(userId, "error", { content: "요청 처리에 실패하였습니다. 다시 시도해주세요" });
                logger.error(err, "failed to publish");
            });
    };

    unsubscribe = (consumerTag: string) => {
        this.rabbitTemplate.unsubscribe(consumerTag);
    };

    subscribe = async (userId: string) => {
        const queueName = `${userId}_${generateRandomId()}`;
        const consumerTag = await this.rabbitTemplate.subscribe(
            queueName,
            userId,
            { durable: false, autoDelete: true },
            (message) => this.sendMessageToClient(userId, message),
        );
        this.chatRoomService.updateConsumerTag(userId, consumerTag);
    };

    private sendMessageToClient = async (userId:string, message:ConsumeMessage) => {
        const messageFromMq: MessageFromInferenceServer = JSON.parse(message.content.toString("utf-8"));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { userId: uid, ...messageToClient } = messageFromMq;
        this.chatRoomService.sendEventToRoom(userId, "subscribe", messageToClient);
    };

    private registDefaultListener = () => {
        this.rabbitTemplate
            .subscribe("defaultListener", "#", { durable: true, autoDelete: false }, this.onMessageToDefaultListener);
    };

    private registCharacterUpdateEventListener = () => {
        this.rabbitTemplate
            .subscribe(
                "characterEventListener",
                "characterUpdate",
                { durable: true, autoDelete: false },
                this.onCharacterUpdateMessageRecieved,
                "toonchatEvent",
            );
    };

    private onMessageToDefaultListener: ConsumeMessageCallback = async (message) => {
        if (!message.content) return;

        const messageFromMq: MessageFromInferenceServer = JSON.parse(message.content.toString("utf-8"));
        if (messageFromMq.fromUser === false) {
            this.updateBotMessageAndHistory(messageFromMq);
        }
    };

    private onCharacterUpdateMessageRecieved: ConsumeMessageCallback = async (message) => {
        const characterUpdateMessage: CharacterUpdateMessage = JSON.parse(message.content.toString("utf-8"));

        const handler = characterUpdateMessage.op?.toLowerCase() === "delete"
            ? this.characterService.deleteCharacterInformation
            : this.characterService.upsertCharacterInformation;

        await handler(characterUpdateMessage);
    };

    private updateBotMessageAndHistory = (messageFromMQ: MessageFromInferenceServer) => {
        logger.debug(messageFromMQ);
        try {
            const msg = this.chatService.updateBotChat(messageFromMQ);
            return this.historyService.updateHistory(messageFromMQ.userId, messageFromMQ.characterId, msg);
        } catch (err) {
            logger.error(err, "failed to update bot message.");
            return undefined;
        }
    };
}

function buildInferenceMessage(
    history: HistoryDocument,
    character: CharacterDocument,
    reference: EmbeddingDocument[] = [],
): MessageToInferenceServer {
    const lastMessage = history.messages.at(-1);
    if (!lastMessage) {
        throw new MongooseError("there is no last message in document");
    }

    return {
        id: String(lastMessage.replyMessageId!),
        task: "inference",
        args: [
            {
                history,
                persona: character ? character.persona.join(" ") : "",
                reference: reference.reduce((prev, cur) => { prev.push(cur.text); return prev; }, new Array<string>()),
                generationArgs: {
                    temperature: 0.3,
                    repetition_penalty: 1.5,
                },
            },
            false,
        ],
        kwargs: new Map<string, string>(),
    };
}

function buildEchoMessage(message: StoredChat, characterId: number): ChatToClient {
    return {
        messageId: message.messageId.toString(),
        characterId,
        createdAt: message.createdAt,
        content: message.content,
        fromUser: message.fromUser,
    };
}
