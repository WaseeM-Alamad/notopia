import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const SideNavContainer = ({ user }) => {
  return (
    <>
      <Navbar user={user} />
      <Sidebar />
    </>
  );
};

export default SideNavContainer;
