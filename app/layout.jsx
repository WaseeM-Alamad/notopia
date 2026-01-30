import React from "react";
import "../assets/styles/globals.css";
import AuthProvider from "@/components/others/AuthProvider";
import { AppProvider } from "@/context/AppContext";
import { SearchProvider } from "@/context/SearchContext";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import FatalErrorBoundary from "@/utils/ErrorBoundry";
import PolyfillClient from "@/utils/PolyfillClient";
import { LabelsProvider } from "@/context/LabelsContext";
import { GlobalProvider } from "@/context/GlobalContext";
import { LayoutProvider } from "@/context/LayoutContext";

export const metadata = {
  title: "Notopia",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "32x32" },
    ],
  },
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
            <LayoutProvider>
              <GlobalProvider>
                <SearchProvider>
                  <AppProvider initialUser={initialUser}>
                    <LabelsProvider userID={initialUser?.id}>
                      <div id="tooltipPortal" />
                      <div id="snackbarPortal" />
                      {children}
                      <div id="menu" />
                      <div id="modal-portal" />
                      <div id="selectionBox" />
                    </LabelsProvider>
                  </AppProvider>
                </SearchProvider>
              </GlobalProvider>
            </LayoutProvider>
          </AuthProvider>
        </FatalErrorBoundary>
      </body>
    </html>
  );
};

export default MainLayout;
