/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { NextFunction, Response } from "express";
import { SocketRequestHandler, RequestWrapper } from ".";

export interface Filter {
    doFilter:(req:RequestWrapper, res:Response, next:NextFunction) => void;
    doSocketFilter:SocketRequestHandler;
}
