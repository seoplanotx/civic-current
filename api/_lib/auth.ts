/**
 * Server-side auth helpers for the Vercel serverless API.
 *
 * Verifies Clerk JWTs from the Authorization header and returns the
 * authenticated user id. Returns null when no valid token is present;
 * callers decide whether to return 401 or fall back to anonymous behavior.
 */

import { createClerkClient, verifyToken, type ClerkClient } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';

let cachedClient: ClerkClient | null = null;

function getClerk(): ClerkClient {
  if (!cachedClient) {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        'CLERK_SECRET_KEY is not set. Configure it in your Vercel project env vars.'
      );
    }
    cachedClient = createClerkClient({ secretKey });
  }
  return cachedClient;
}

export interface AuthenticatedUser {
  userId: string;
  email?: string;
}

/**
 * Verify the bearer token in the Authorization header. Returns the
 * authenticated user or null. Never throws on missing/invalid tokens —
 * the request handler decides how to respond.
 */
export async function authenticateRequest(
  req: VercelRequest
): Promise<AuthenticatedUser | null> {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1];

  try {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) return null;
    const { sub: userId } = await verifyToken(token, { secretKey });
    if (!userId) return null;

    // Fetch user email lazily — used for Stripe customer linking.
    let email: string | undefined;
    try {
      const user = await getClerk().users.getUser(userId);
      email = user.primaryEmailAddress?.emailAddress;
    } catch {
      /* email lookup failure is non-fatal */
    }

    return { userId, email };
  } catch {
    return null;
  }
}

/**
 * Convenience: 401 helper used by handlers that strictly require auth.
 */
export function unauthorized(): { status: 401; body: { error: string; code: 'unauthenticated' } } {
  return {
    status: 401,
    body: { error: 'Authentication required', code: 'unauthenticated' },
  };
}
