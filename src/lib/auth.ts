import { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import NaverProvider from 'next-auth/providers/naver';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { isBootstrapAdmin } from '@/lib/admin-emails';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    // 구글·네이버는 확인된 이메일을 주므로 같은 이메일의 기존 계정(이메일 가입 등)에 연결한다
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID ?? '',
      clientSecret: process.env.NAVER_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    // 카카오는 이메일 동의가 선택이라 이메일이 없을 수 있다(계정 자동 연결 안 함)
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID ?? '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? '',
    }),
    // 이메일 + 비밀번호 로그인. 가입은 /signup(→ /api/auth/signup)에서만 한다.
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? '';
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // 로그인 시점에만 DB에서 role을 읽는다. ADMIN_EMAILS에 있으면 관리자로 승격.
      if (user) {
        token.sub = user.id;
        const stored = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, role: true } });
        let role = stored?.role ?? 'USER';
        if (role !== 'ADMIN' && isBootstrapAdmin(stored?.email)) {
          await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
          role = 'ADMIN';
        }
        token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role === 'ADMIN' ? 'ADMIN' : 'USER';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
