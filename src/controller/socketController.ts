/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
import { Inject, Service } from "typedi";
import { Socket } from "socket.io";
import { logger } from "../config";
import { checkCanRequest, getCharacter } from ".";
import {
    ChatRoomService, RabbitService,
} from "../service";
import { ChatFromClient, SocketController } from "../types";
import { Event, EventController } from "../decorator/eventDefinition";
import { CustomError } from "../exceptions";

@EventController()
@Service()
export class SocketEventController implements SocketController {
    @Inject()
    private chatRoomService:ChatRoomService;

    @Inject()
    private messageService:RabbitService;

    @Event("publish")
    handleOnPublishMessage = async (socket: Socket, data: ChatFromClient) => {
        const { userId } = socket.data;
        checkCanRequest(userId, data.characterId, data.content)
            .then(() => getCharacter(data.characterId))
            .then((character) => this
                .messageService.saveAndPublishEchoMessageAndInferenceMessage(data, userId, character))
            .catch((err) => {
                logger.error({ err }, err.message);
                const errorMessage = err instanceof CustomError ? err.message : "요청 처리에 실패하였습니다.";
                this.chatRoomService.sendEventToRoom(userId, "error", { content: errorMessage });
            });
    };

    @Event("disconnect")
    handleOnDisconnectMessage = async (socket: Socket) => {
        const leaveResult = socket.leave(socket.data.userId);
        return leaveResult ? leaveResult.then(() => this.postDisconnect(socket)) : this.postDisconnect(socket);
    };

    @Event("connect")
    handleOnConnectMessage = async (socket: Socket) => {
        logger.info({ connection: "connected", remoteHost: socket.data.remoteAddress });
        const { userId } = socket.data;
        const joinRoomResult = socket.join(userId);

        return joinRoomResult
            ? joinRoomResult.then(() => this.postJoinRoom(userId, socket)) : this.postJoinRoom(userId, socket);
    };

    private postJoinRoom(userId: string, socket:Socket) {
        if (this.chatRoomService.getUserCountInRoom(userId) === 1) {
            // 구독 && 구독 취소를 위한 정보 저장
            this.messageService.subscribe(userId)
                .catch((err) => {
                    logger.fatal({ err, ...socket.data }, "Failed to subscribe message queue");
                    socket.disconnect(true);
                });
        }
    }

    private postDisconnect(socket:Socket) {
        const userCountInRoom = this.chatRoomService.getUserCountInRoom(socket.data.userId);
        if (!userCountInRoom && this.chatRoomService.isRoomExist(socket.data.userId)) {
            this.messageService.unsubscribe(this.chatRoomService.getConsumerTag(socket.data.userId)!);
            this.chatRoomService.deleteConsumerTag(socket.data.userId);
        }
        // 소켓 연결 해제시 구독 취소
        logger.info({ connection: "disconnected", remoteHost: socket.data.remoteAddress });
    }
}
