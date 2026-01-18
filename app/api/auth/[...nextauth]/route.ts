import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/db/mongodb'
import User from '@/lib/models/User'

import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        GithubProvider({
            clientId: process.env.GITHUB_ID || '',
            clientSecret: process.env.GITHUB_SECRET || '',
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required')
                }

                await connectDB()
                const user = await User.findOne({ email: credentials.email })

                if (!user) {
                    throw new Error('No user found with this email')
                }

                // If user doesn't have a password (e.g. signed up with OAuth), fail for credentials
                if (!user.password) {
                    return null
                }

                // Check ban status
                if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
                    throw new Error(`Account banned until ${new Date(user.bannedUntil).toLocaleString()}`)
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    throw new Error('Invalid password')
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google' || account?.provider === 'github') {
                await connectDB()
                const existingUser = await User.findOne({ email: user.email })

                if (existingUser) {
                    if (existingUser.bannedUntil && new Date(existingUser.bannedUntil) > new Date()) {
                        return `/login?error=Account banned until ${encodeURIComponent(new Date(existingUser.bannedUntil).toLocaleString())}`
                    }
                }

                if (!existingUser) {
                    // Create new user for OAuth if doesn't exist
                    await User.create({
                        name: user.name as string,
                        email: user.email as string,
                        role: 'student', // Default role
                        image: user.image as string || undefined,
                        provider: account.provider
                    })
                }
                return true
            }
            return true
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id
                // fetching fresh user role from DB is safer if we just created them
                if (account?.provider === 'google' || account?.provider === 'github') {
                    await connectDB()
                    const dbUser = await User.findOne({ email: user.email })
                    if (dbUser) {
                        token.id = dbUser._id.toString()
                        token.role = dbUser.role as any
                    }
                } else {
                    token.role = user.role as any
                }
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as 'tech' | 'student'
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
