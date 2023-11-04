/* eslint-disable max-classes-per-file */
/* eslint-disable import/prefer-default-export */
class CustomError extends Error {}
export class CustomWarnError extends CustomError {}
export class CustomErrorError extends CustomError {}
export class InvalidRequestError extends CustomWarnError {}
export class EmbeddingRequestError extends CustomErrorError {}
