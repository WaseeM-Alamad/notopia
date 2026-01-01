import connectDB from "@/config/database";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { nanoid } from "nanoid";
import mongoose from "mongoose";

function getInitials(username = "") {
  if (!username) return "";
  const clean = username.replace(/[^a-zA-Z0-9]/g, "");
  return clean.slice(0, 2).toUpperCase();
}

function generateAvatar(username) {
  return `data:image/svg+xml;utf8,
  <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
    <rect width='100' height='100' fill='%23607fde'/>
    <text x='50' y='50' font-size='40' text-anchor='middle'
      dominant-baseline='central' fill='white' font-family='Arial'>
      ${getInitials(username)}
    </text>
  </svg>`;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error(
              JSON.stringify({
                type: "both",
                message: "Invalid email or password",
              })
            );
          }

          await connectDB();

          const user = await User.findOne({ email: credentials.email }).select(
            "+password +tokenExpDate"
          );

          const FAKE_HASH =
            "$2b$10$CwTycUXWue0Thq9StjUM0uJ8gJv0WjRLMZs4ZWxIzeZ6lA94iWZlG";

          const hashedPassword = user?.password || FAKE_HASH;

          const isValid = await bcrypt.compare(
            credentials.password,
            hashedPassword
          );

          if (!user || !user.password || !isValid) {
            throw new Error(
              JSON.stringify({
                type: "both",
                message: "Invalid email or password",
              })
            );
          }

          if (!user.isVerified) {
            const isRecent = user.tokenExpDate > new Date();

            if (isRecent) {
              const timeLeft = Math.ceil(
                (user.tokenExpDate - new Date()) / 1000 / 60
              );

              throw new Error(
                JSON.stringify({
                  type: "email",
                  message: `Verification link already sent. Try again in ${timeLeft} minute(s).`,
                })
              );
            }

            const resend = new Resend(process.env.RESEND_API_KEY);
            const token = nanoid(32);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await User.updateOne(
              { email: credentials.email },
              { $set: { token, tokenExpDate: expiresAt } }
            );

            const link = `https://notopia.app/auth/verify?token=${token}`;

            await resend.emails.send({
              from: "Notopia <noreply@notopia.app>",
              to: credentials.email,
              subject: "Verify your email",
              html: `
                <div style="font-family:sans-serif;padding:20px;">
                  <h2>Verify your email</h2>
                  <a href="${link}">Verify Email</a>
                  <p>This link expires in 15 minutes.</p>
                </div>
              `,
            });

            throw new Error(
              JSON.stringify({
                type: "email",
                message: "Email not verified. Verification link has been sent.",
              })
            );
          }

          return {
            id: user._id.toString(),
            email: user.email,
          };
        } catch (err) {
          console.error("Authorize error:", err);
          throw err;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async redirect({ baseUrl }) {
      return `${baseUrl}/main`;
    },

    async signIn({ account, profile }) {
      if (account?.provider !== "google" || !profile?.email) return true;

      await connectDB();

      let user = await User.findOne({ email: profile.email });

      if (!user) {
        user = await User.create({
          email: profile.email,
          username: profile.name?.slice(0, 20) || "user",
          image: profile.picture,
          isVerified: true,
          googleId: profile.id,
        });
      } else if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      try {
        await connectDB();

        if (!token?.id && !token?.email) {
          session.user = null;
          return session;
        }

        let user = null;

        if (token.id && mongoose.Types.ObjectId.isValid(token.id)) {
          user = await User.findById(token.id);
        }

        if (!user && token.email) {
          user = await User.findOne({ email: token.email });
        }

        if (!user) {
          session.user = null;
          return session;
        }

        session.user = {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          displayName: user.displayName || "",
          tempEmail: user.tempEmail,
          image: user.image || generateAvatar(user.username),
        };

        return session;
      } catch (err) {
        console.error("Session error:", err);
        session.user = null;
        return session;
      }
    },
  },

  session: {
    strategy: "jwt",
  },
};
