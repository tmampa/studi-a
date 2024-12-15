import { verifyToken } from './jwt';
import { headers } from 'next/headers';

export async function verifyAuth(req) {
  try {
    // Get authorization header
    const headersList = headers();
    const authorization = headersList.get('Authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }

    // Extract token
    const token = authorization.split(' ')[1];
    if (!token) {
      return null;
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    return payload.userId;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
