import fs from "fs";
import axios from "axios";
import assert from "assert";
import { Request } from "express";
import logger from "./logger";
import { TypeSocket } from "./types";

const url = "https://api.openai.com/v1/embeddings";
const openaiKey = process.env.OPENAI_API_KEY;

assert(openaiKey);

export function generateRandomId() : string {
    return Math.random().toString(36).substring(2, 10);
}

export async function getEmbedding(query:string) {
    if (process.env.PROFILE !== "prod") return JSON.parse(fs.readFileSync("mockEmbedding.txt", { encoding: "utf-8" }));
    // openai embedding 사용
    const response = await axios.post(url, {
        input: query,
        model: "text-embedding-ada-002",
    }, {
        headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
        },
    });

    if (response.status === 200) {
        return response.data.data[0].embedding as Array<number>;
    }

    logger.error(`Failed to get embedding. Status code: ${response.status || "undefined"}`);
    return undefined;
}

export function getCurrentDate(today: Date) {
    const startDay = new Date(today);
    startDay.setHours(0, 0, 0, 0);
    return startDay;
}

export function getRemoteHost(req:Request|TypeSocket) {
    if ("ip" in req) {
        const realRemoteAddress = req.header("x-forwarded-for");
        if (realRemoteAddress !== undefined) {
            return realRemoteAddress;
        }
        logger.debug(req.headers);
        return req.ip;
    }
    if ("handshake" in req) {
        logger.debug(req.handshake.headers);
        return req.handshake.address;
    }
    return undefined;
}
