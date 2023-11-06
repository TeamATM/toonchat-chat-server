import mongoose from "mongoose";
import Container from "typedi";
import { EnvConfig, logger } from "../config";

const uri = Container.get(EnvConfig).mongoUri;

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
