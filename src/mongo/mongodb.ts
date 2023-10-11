import mongoose from "mongoose";
import logger from "../logger";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/";
export const historyLength = Number(process.env.CHAT_HISTORY_LENGTH) || 10;
export const maxRefrenceLength = Number(process.env.MAX_REFERENCE_LENGTH) || 3;

const connectionOptions: mongoose.ConnectOptions = {
    maxPoolSize: 100, // 100 is default value
    autoIndex: false,
    dbName: "test2",
};

export const connectToMongo = () => {
    mongoose.connect(uri, connectionOptions)
        .then(async (v) => {
            logger.info("Connected to MongoDB");
            v.connection.on("errer", (err) => { logger.fatal(err, "failed to connect Mongo"); });
        })
        .catch((err) => { throw err; });
};
