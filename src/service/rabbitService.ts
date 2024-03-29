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
    ChatToClient, EmbeddingDocument, HistoryDocument, MessageToInferenceServer, PublishMessage,
} from "../types";
import {
    ChatService, HistoryService,
    CharacterService, ChatRoomService, VectorSearchService, buildBotStoredChat,
} from ".";
import { CustomErrorWrapper } from "../exceptions";

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

    saveAndPublishEchoMessageAndInferenceMessage = (
        data: ChatFromClient,
        userId: string,
        character:CharacterDocument,
    ) => {
        const storedChat = this.chatService.updateUserChat(userId, data.characterId, data.content);

        const echoMessage = buildEchoMessage(storedChat, data.characterId);

        return Promise.all([
            this.publishEchoMessage(userId, echoMessage),
            this.publishInferenceRequestMessage(userId, data, storedChat, character),
        ]);
    };

    // eslint-disable-next-line arrow-body-style
    private publishEchoMessage = async (userId: string, echoMessage: PublishMessage) => {
        return this.rabbitTemplate.publish("amq.topic", userId, echoMessage)
            .catch((err) => {
                this.chatRoomService.sendEventToRoom(userId, "error", { content: "요청 처리에 실패하였습니다. 다시 시도해주세요." });
                logger.error(err, "failed to publish");
            });
    };

    private publishInferenceRequestMessage = async (
        userId: string,
        data: ChatFromClient,
        msg: StoredChat,
        character: CharacterDocument,
    // eslint-disable-next-line arrow-body-style
    ) => {
        return Promise.allSettled([
            this.historyService.updateHistory(userId, data.characterId, msg),
            this.vectorSearchService.searchSimilarDocuments(data.content),
        ]).then(([history, vectorSearchResult]) => {
            if (vectorSearchResult.status === "rejected") {
                logger.error({ vectorSearchResult }, "Failed to resolve vectorSearch");
            }
            if (history.status === "rejected") {
                throw history.reason;
            }
            const inferenceMessage = buildInferenceMessage(
                history.value,
                character,
                vectorSearchResult.status === "fulfilled" ? vectorSearchResult.value : [],
            );
            return this.rabbitTemplate.publish("celery", "celery", inferenceMessage);
        }).catch((err) => {
            throw new CustomErrorWrapper(err, "요청 처리에 실패하였습니다. 다시 시도해주세요");
        });
    };

    unsubscribe = (consumerTag: string) => {
        this.rabbitTemplate.unsubscribe(consumerTag);
    };

    subscribe = async (userId: string) => {
        logger.info({ userId }, "Subscribe Message Queue");
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

        return handler(characterUpdateMessage).then();
    };

    private updateBotMessageAndHistory = async (messageFromMQ: MessageFromInferenceServer) => {
        logger.debug(messageFromMQ);
        const { userId, characterId } = messageFromMQ;
        const msg = buildBotStoredChat(messageFromMQ.content, messageFromMQ.messageId);
        Promise.all([
            this.chatService.updateBotChat(userId, characterId, msg),
            this.historyService.updateHistory(messageFromMQ.userId, messageFromMQ.characterId, msg),
        ]).catch((err) => logger.error(err, "failed to update bot message"));
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
                greetingMessage: character.greetingMessage,
                persona: character ? character.persona.join(" ") : "",
                reference: reference.reduce((prev, cur) => { prev.push(cur.text); return prev; }, new Array<string>()),
                generationArgs: { // TODO: DB에서 값 가져오기
                    temperature: 0.3,
                    repetition_penalty: 1.2,
                    do_sample: true,
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
