import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/utils/password'

const providers = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.')
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      })

      if (!user) {
        throw new Error('존재하지 않는 사용자입니다.')
      }

      const isValid = await verifyPassword(
        credentials.password,
        user.passwordHash
      )

      if (!isValid) {
        throw new Error('비밀번호가 올바르지 않습니다.')
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || null,
      }
    },
  }),
]

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
