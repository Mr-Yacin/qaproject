import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { UserService } from '@/lib/services/user.service';
import { rateLimit, RATE_LIMIT_CONFIGS, RateLimitError } from '@/lib/middleware/rate-limit.middleware';

const userService = new UserService();

// Rate limit store for authentication attempts
const authRateLimitStore = new Map<string, { attempts: number; resetAt: number }>();

/**
 * Check authentication rate limit
 * Requirements: 7.2 - Rate limiting for authentication
 */
function checkAuthRateLimit(email: string): void {
  const now = Date.now();
  const key = `auth:${email.toLowerCase()}`;
  
  let entry = authRateLimitStore.get(key);
  
  // Reset if window has passed
  if (entry && now > entry.resetAt) {
    entry = undefined;
    authRateLimitStore.delete(key);
  }
  
  if (!entry) {
    entry = {
      attempts: 0,
      resetAt: now + RATE_LIMIT_CONFIGS.AUTH.windowMs,
    };
    authRateLimitStore.set(key, entry);
  }
  
  // Check if limit exceeded
  if (entry.attempts >= RATE_LIMIT_CONFIGS.AUTH.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    throw new RateLimitError(
      `Too many login attempts. Please try again in ${retryAfter} seconds.`,
      retryAfter
    );
  }
  
  // Increment attempts
  entry.attempts += 1;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Apply rate limiting per email address
          checkAuthRateLimit(credentials.email);

          // Authenticate user using the User model
          const user = await userService.authenticateUser(
            credentials.email,
            credentials.password
          );

          if (!user) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          if (error instanceof RateLimitError) {
            // Log rate limit error
            console.warn(`Rate limit exceeded for email: ${credentials.email}`);
            return null;
          }
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
