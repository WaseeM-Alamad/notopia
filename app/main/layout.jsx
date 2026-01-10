import Navbar from "@/components/others/Navbar";
import Nn from "@/components/others/navbar/Nn";
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
          {/* <Navbar initialUser={session?.user} /> */}
          <Nn />
          <Sidebar />
          {children}
        </>
      )}
    </>
  );
};

export default Layout;
