import React from "react";
import "../assets/styles/globals.css";
import AuthProvider from "@/components/others/AuthProvider";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/others/Navbar";
import Sidebar from "@/components/others/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export const metadata = {
  title: "Notopia",
};

const MainLayout = async ({ children }) => {
  const session = await getServerSession(authOptions);
  return (
    <AuthProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
            rel="stylesheet"
          />
        </head>
        <body suppressHydrationWarning>
            {session && (
              <>
                <Navbar user={session?.user} />
                <Sidebar />
              </>
            )}

            {children}
          <div id="profileMenu"></div>
          <div id="colorMenuPortal"></div>
          <div id="modal-portal"></div>
          <div id="moreMenu"></div>
        </body>
      </html>
    </AuthProvider>
  );
};

export default MainLayout;
