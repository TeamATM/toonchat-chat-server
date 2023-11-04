/* eslint-disable no-param-reassign */
import { subscribeChatMessage } from "../../message_queue";
import { TypeSocket, MessageFromInferenceServer } from "../../types";
import { generateRandomId } from "../../utils";

export async function subscribeMessageQueue(socket: TypeSocket) {
    const onMessageToUser = async (message: MessageFromInferenceServer) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { userId, ...messageToClient } = message;
        return socket.emit("subscribe", messageToClient);
    };

    // 구독 && 구독 취소를 위한 정보 저장
    const queueName = `${socket.data.userId}_${generateRandomId()}`;
    const consumerTag = await subscribeChatMessage(
        queueName,
        socket.data.userId,
        { durable: false, autoDelete: true },
        onMessageToUser,
    );
    socket.data.consumerTag = consumerTag;
}
