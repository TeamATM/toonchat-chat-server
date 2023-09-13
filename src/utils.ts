/* eslint-disable import/prefer-default-export */

export function generateRandomId() : string {
    return Math.random().toString(36).substring(2, 10);
}
