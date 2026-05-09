import jwt from 'jsonwebtoken';
import { getCurrentUser } from "../utils/auth";

export default defineEventHandler((event) => {
  const session = getCurrentUser(event);
  
  if (!session) {
    setHeader(event, 'Content-Type', 'text/plain');
    setResponseStatus(event, 401);
    return "Not logged in";
  }

  const apiKey = process.env.ABLY_KEY;
  if (!apiKey) {
    setHeader(event, 'Content-Type', 'text/plain');
    setResponseStatus(event, 500);
    return "ABLY_KEY is not configured on the server.";
  }

  const [keyName, keySecret] = apiKey.split(':');
  if (!keyName || !keySecret) {
    setHeader(event, 'Content-Type', 'text/plain');
    setResponseStatus(event, 500);
    return "Invalid ABLY_KEY format.";
  }

  const clientId = session.username;

  const token = jwt.sign(
    {
      'x-ably-capability': JSON.stringify({
        'room:*': ['subscribe', 'publish', 'presence', 'history'],
        '*': ['subscribe', 'publish', 'presence', 'history']
      }),
      'x-ably-clientId': clientId,
    },
    keySecret,
    {
      expiresIn: '1h',
      keyid: keyName,
    }
  );

  setHeader(event, 'Content-Type', 'application/jwt');
  return token;
});
