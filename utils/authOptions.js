import connectDB from "@/config/database";
import GoogleProvider from "next-auth/providers/google";
import User from "@/models/User";

export const authOptions = {
  providers: [
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
      // Always redirect to /main after sign in
      return `${baseUrl}/main`;
    },
    // Invoked on successful sign-in
    async signIn({ profile }) {
      //1. Connect to the database
      await connectDB();
      //2. Check if user exists
      const userExists = await User.findOne({ email: profile.email });
      //3. If not, then add user to database
      if (!userExists) {
        // Truncate username if too long
        const username = profile.name.slice(0, 20);

        await User.create({
          email: profile.email,
          username,
          image: profile.picture,
        });
      }
      //4. Return true to allow sign in
      return true;
    },
    // Modifies the session object
    async session({ session }) {
      await connectDB(); // ✅ Ensure DB is connected
    
      const user = await User.findOne({ email: session.user.email });
    
      if (user) {
        session.user.id = user._id.toString();
        session.user.name = user.username;
        session.user.image = user.image;
      }
    
      return session;
    },
  },
};
