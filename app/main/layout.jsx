import Navbar from "@/components/others/navbar/Navbar";
import Sidebar from "@/components/others/Sidebar";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";
import React from "react";

const Layout = async ({ children }) => {
  const session = await getServerSession(authOptions);
  return (
    <>
      {session && (
        <>
          <Navbar />
          <Sidebar />
          {children}
        </>
      )}
    </>
  );
};

export default Layout;
