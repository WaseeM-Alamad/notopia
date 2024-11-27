import React from "react";
import "../assets/styles/globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export const metadata = {
  title: "notopia",
};

const MainLayout = async ({ children }) => {
  const session = await getServerSession(authOptions);
  const image = session?.user.image;
  const email = session?.user.email;
  const name = session?.user.name;

  const handleRefresh = async (refresh) => {
    "use server";
    console.log(refresh);
    setRefreshValue(refresh);
  };

  return (
    <AuthProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=McLaren&display=swap"
            rel="stylesheet"
          />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mayan+Numerals&display=swap"
            rel="stylesheet"
          />

          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+Display:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
            rel="stylesheet"
          />

          <link
            rel="icon"
            href="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' class='MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-1iirmgg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='m6 14 3 3v5h6v-5l3-3V9H6zm5-12h2v3h-2zM3.5 5.88l1.41-1.41 2.12 2.12L5.62 8zm13.46.71 2.12-2.12 1.41 1.41L18.38 8z'/%3E%3C/svg%3E"
            type="image/svg+xml"
          />
        </head>
        <body>
          <div>
            {session && (
              <Navbar
                image={image}
                email={email}
                name={name}
                handleRefresh={handleRefresh}
                suppressHydrationWarning
              />
            )}
            <main>{children}</main>
          </div>
        </body>
      </html>
    </AuthProvider>
  );
};

export default MainLayout;
