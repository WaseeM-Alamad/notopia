import React from "react";
import "../assets/styles/globals.css";
import AuthProvider from "@/components/others/AuthProvider";
import { AppProvider } from "@/context/AppContext";
import { SearchProvider } from "@/context/SearchContext";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import FatalErrorBoundary from "@/utils/ErrorBoundry";
import PolyfillClient from "@/utils/PolyfillClient";

export const metadata = {
  title: "Notopia",
};

const MainLayout = async ({ children }) => {
  const session = await getServerSession(authOptions);
  const initialUser = session?.user;

  return (
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
        <FatalErrorBoundary>
          <PolyfillClient />
          <AuthProvider>
            <SearchProvider>
              <AppProvider initialUser={initialUser}>
                <div id="tooltipPortal" />
                <div id="snackbarPortal" />

                {children}

                <div id="menu" />
                <div id="modal-portal" />
                <div id="selectionBox" />
              </AppProvider>
            </SearchProvider>
          </AuthProvider>
        </FatalErrorBoundary>
      </body>
    </html>
  );
};

export default MainLayout;
