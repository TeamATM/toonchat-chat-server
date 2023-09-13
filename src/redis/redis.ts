export function isTokenExist(token: string|undefined): boolean {
    return !!token;
}

export function existMessageInProcess(username: string) {
    return username === "test";
}
