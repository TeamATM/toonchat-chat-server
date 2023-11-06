import "reflect-metadata";
import "./config/datadogConfig";
import "./loader";
import Container from "typedi";
import { connectToMongo } from "./repository";
import { Server } from "./server";

connectToMongo();

Container.get(Server).startServer();
