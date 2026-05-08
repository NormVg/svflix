import { issueSessionCookie, validateLogin } from "../../utils/auth";

type LoginBody = {
  username?: string;
  password?: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event);
  const username = body.username?.trim() || "";
  const password = body.password || "";

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: "Username and password are required." });
  }

  if (!validateLogin(event, username, password)) {
    throw createError({ statusCode: 401, statusMessage: "Invalid username or password." });
  }

  issueSessionCookie(event, username);
  return { success: true, username };
});
