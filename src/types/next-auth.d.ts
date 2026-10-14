import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      /** 로그인 시점의 권한(표시용). 관리자 기능은 서버에서 DB role로 다시 확인한다. */
      role?: 'USER' | 'ADMIN';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'USER' | 'ADMIN';
  }
}
