import mongoose from "mongoose";
import { Message } from "../message_queue/types";
import { messageSchema } from "./schema";

// eslint-disable-next-line import/prefer-default-export
export const MessageModel = mongoose.model<Message>("message", messageSchema);
// createIndex({ userId: 1, characterName: 1 });
// createIndex({ createdAt: 1 });

// export const ViewModel = mongoose.model("view", viewSchema, "view");
// ViewModel.createCollection({
//     viewOn: "stomp_messages",
//     pipeline: [
//         {
//           $sort: { createdAt: 1 } // Use -1 for descending order
//         },
//         {
//           $group: {
//             _id: { userId: "$userId", characterName: "$characterName" },
//             messages: {
//               $push: {
//                 messageId: "$messageId",
//                 content: "$content",
//                 createdAt:"$createdAt"
//               }
//             }
//           }
//         },
//         {
//           $project : {
//             userId : '$_id.userId',
//             characterName : '$_id.characterName',
//             messages : 1,
//             _id : 0
//           }
//         }
//     ]
// })
