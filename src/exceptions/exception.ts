/* eslint-disable max-classes-per-file */
/* eslint-disable import/prefer-default-export */
export class CustomError extends Error {}
export class CustomWarnError extends CustomError {}
export class CustomErrorError extends CustomError {}
export class InvalidRequestError extends CustomWarnError {}
export class EmbeddingRequestError extends CustomErrorError {}

export class NotImplementError extends Error {}
export class CustomErrorWrapper extends CustomError {
    error;

    message;

    constructor(error:Error, message:string) {
        super();
        this.error = error;
        this.message = message;
    }
}
