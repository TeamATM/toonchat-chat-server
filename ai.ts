import "./src/config";
import { sub, publish } from "./src/message_queue/broker";
import { MessageFromMQ, MessageToAI } from "./src/message_queue/types";

sub("test", { durable: true, autoDelete: false }, (msg) => {
    const tmp:MessageToAI = msg as unknown as MessageToAI;
    console.log(tmp);
    const data:MessageFromMQ = {
        messageId: tmp.id,
        characterId: tmp.args[0].characterId,
        createdAt: new Date(),
        userId: tmp.args[0].userId,
        fromUser: false,
        content: `this is a message from botId: ${tmp.args[0].characterId}`,
    };
    return publish("amq.topic", msg.userId, data).then(() => true).catch((err) => { console.error(err); return false; });
}, false);
