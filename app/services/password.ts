const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), (value) => value.toString(16).padStart(2, "0")).join("");

export const hashPassword = async (password: string) => toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password)));

export const passwordMatches = async (password: string, passwordHash: string) => await hashPassword(password) === passwordHash;
