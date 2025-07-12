import connectDB from "@/config/database";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { nanoid } from "nanoid";

export const authOptions = {
  providers: [
    // 🔐 Credentials login (email + password)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
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

          if (!user || !credentials?.password || !user?.password || !isValid) {
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
              const unit = timeLeft === 1 ? "minute" : "minutes";
              const message = `Verification link has already been sent. Please try again in ${timeLeft} ${unit}`;
              throw new Error(
                JSON.stringify({
                  type: "email",
                  message: message,
                })
              );
            }

            const resend = new Resend(process.env.RESEND_API_KEY);

            const token = nanoid(32);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await User.updateOne(
              { email: credentials.email },
              { $set: { token: token, tokenExpDate: expiresAt } },
              { upsert: true }
            );

            // const link = `http://localhost:3000/auth/verify?token=${token}`;
            const link = `https://notopia.app/auth/verify?token=${token}`;

            await resend.emails.send({
              from: "Notopia <noreply@notopia.app>",
              to: credentials.email,
              subject: "Verify your email",
              html: `
              <div style="font-family:sans-serif;padding:20px;">
                <h2>🔐 Verify your email</h2>
                <p>Click below to verify your account:</p>
                <a href="${link}" style="display:inline-block;background:#4F46E5;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Verify Email</a>
                <p style="font-size:14px;color:#666;">This link expires in 15 minutes.</p>
              </div>
            `,
            });

            throw new Error(
              JSON.stringify({
                type: "email",
                message:
                  "Email not verified. A verification link has been sent",
              })
            );
          }

          return {
            id: user._id.toString(),
            email: user.email,
            tempEmail: user.tempEmail,
            name: user.username,
            image: user?.image,
          };
        } catch (error) {
          console.log("error signing in", error);
          throw error;
        }
      },
    }),

    // 🌐 Google login
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
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/main`;
    },

    async signIn({ profile, account }) {
      // Only for Google login
      if (account?.provider === "google" && profile?.email) {
        await connectDB();

        const userExists = await User.findOne({ email: profile.email });

        if (!userExists) {
          const username = profile.name.slice(0, 20);

          await User.create({
            email: profile.email,
            username,
            image: profile.picture,
            isVerified: true,
          });
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.tempEmail = user.tempEmail;
      }
      return token;
    },

    async session({ session, token }) {
      await connectDB();

      const userId = session.user.id || token.id;
      const user = await User.findById(userId);

      function getInitials(username) {
        if (!username) return "";
        const clean = username.replace(/[^a-zA-Z0-9]/g, "");
        return clean.slice(0, 2).toUpperCase();
      }

      const userImage =
        user?.image ||
        `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23607fde'/><text x='48' y='50' font-size='40' text-anchor='middle' dominant-baseline='central' fill='white' font-family='Arial'>${getInitials(user?.username)}</text></svg>`;

      if (user) {
        session.user.id = user._id.toString();
        session.user.name = user.username;
        session.user.email = user.email; // This will be the updated email from DB
        session.user.image = userImage;
        session.user.tempEmail = user.tempEmail;
      } else {
        // fallback from token if user not found
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture || userImage;
        session.user.tempEmail = token.tempEmail;
      }

      return session;
    },
  },

  session: {
    strategy: "jwt",
  },
};
