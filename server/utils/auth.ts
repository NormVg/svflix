import { createHmac, timingSafeEqual } from "node:crypto";
import type { H3Event } from "h3";

const COOKIE_NAME = "svflix_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

type SessionPayload = {
  username: string;
  exp: number;
};

const encode = (value: string) => Buffer.from(value, "utf-8").toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf-8");

const getConfig = (event: H3Event) => {
  const config = useRuntimeConfig(event);
  const usersRaw = config.appAuthUsers || process.env.APP_AUTH_USERS || "";
  const password = config.appAuthPassword || process.env.APP_AUTH_PASSWORD || "";
  const secret = config.appAuthSessionSecret || process.env.APP_AUTH_SESSION_SECRET || "";

  const users = usersRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!users.length || !password || !secret) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Auth env missing. Set APP_AUTH_USERS, APP_AUTH_PASSWORD, and APP_AUTH_SESSION_SECRET.",
    });
  }

  return { users, password, secret };
};

const sign = (payloadEncoded: string, secret: string) =>
  createHmac("sha256", secret).update(payloadEncoded).digest("base64url");

export const issueSessionCookie = (event: H3Event, username: string) => {
  const { secret } = getConfig(event);
  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const payloadEncoded = encode(JSON.stringify(payload));
  const signature = sign(payloadEncoded, secret);
  const token = `${payloadEncoded}.${signature}`;

  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
};

export const clearSessionCookie = (event: H3Event) => {
  deleteCookie(event, COOKIE_NAME, { path: "/" });
};

const safeCompare = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};

const verifyToken = (event: H3Event, token: string): SessionPayload | null => {
  const { secret } = getConfig(event);
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return null;

  const expectedSig = sign(payloadEncoded, secret);
  if (!safeCompare(signature, expectedSig)) return null;

  try {
    const payload = JSON.parse(decode(payloadEncoded)) as SessionPayload;
    if (!payload.username || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

export const getCurrentUser = (event: H3Event) => {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) return null;
  return verifyToken(event, token);
};

export const requireUser = (event: H3Event) => {
  const currentUser = getCurrentUser(event);
  if (!currentUser) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized. Please login." });
  }
  return currentUser;
};

export const validateLogin = (event: H3Event, username: string, password: string) => {
  const config = getConfig(event);
  const validUsername = config.users.includes(username);
  const validPassword = safeCompare(password, config.password);
  return validUsername && validPassword;
};
