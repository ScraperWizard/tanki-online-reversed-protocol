import dotenv from "dotenv";
dotenv.config();

export const ENABLE_INCOMING = process.env.ENABLE_INCOMING;
export const ENABLE_OUTGOING = process.env.ENABLE_OUTGOING;
export const ENABLE_BASIC_INCOMING = process.env.ENABLE_BASIC_INCOMING;
export const ENABLE_BASIC_OUTGOING = process.env.ENABLE_BASIC_OUTGOING;
export const ENABLE_INFO = process.env.ENABLE_INFO;
export const ENABLE_ERROR = process.env.ENABLE_ERROR;
export const ENABLE_WARNING = process.env.ENABLE_WARNING;
export const IO_EMIT = process.env.IO_EMIT;
export const IO_ONEVENT = process.env.IO_ONEVENT;
export const CAPTCHA_HANDLING = process.env.CAPTCHA_HANDLING == "true";
export const CAPTCHA_THREADS = process.env.CAPTCHA_THREADS;
export const CAPTCHA_POOL_SIZE = process.env.CAPTCHA_POOL_SIZE;
export const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY;
export const MAX_CLICKER_INTERVAL_TIMEOUT = 525;
export const MIN_CLICKER_INTERVAL_TIMEOUT = 400;
