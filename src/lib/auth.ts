import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { readCSV, User as DbUser } from './githubDb';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mật khẩu', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập đầy đủ email và mật khẩu.');
        }

        // Read users from CSV
        const users = await readCSV<DbUser>('users.csv');
        const user = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());

        if (!user) {
          throw new Error('Email không tồn tại trong hệ thống.');
        }

        // Compare password hashes (async to avoid blocking event loop)
        const isValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isValid) {
          throw new Error('Mật khẩu không chính xác.');
        }

        return {
          id: user.user_id,
          name: user.full_name,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      
      // Handle session updates (e.g. updating profile details)
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.role) token.role = session.role;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
};
