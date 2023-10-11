/* eslint-disable no-param-reassign */
import { subscribe, MessageFromMQ } from "../message_queue";
import { TypeSocket } from "./types";
import { generateRandomId } from "../utils";

// eslint-disable-next-line import/prefer-default-export
export async function subscribeMessageQueue(socket: TypeSocket) {
    const onMessageToUser = async (message: MessageFromMQ) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { userId, ...messageToClient } = message;
        return socket.emit("subscribe", messageToClient);
    };

    // 구독 && 구독 취소를 위한 정보 저장
    const queueName = `${socket.data.username}_${generateRandomId()}`;
    const consumerTag = await subscribe(
        queueName,
        socket.data.username,
        { durable: false, autoDelete: true },
        onMessageToUser,
    );
    socket.data.consumerTag = consumerTag;
}
