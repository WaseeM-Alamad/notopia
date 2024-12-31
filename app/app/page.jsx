"use client";
import LabelIcon from "@/components/icons/LabelIcon";
import NotesIcon from "@/components/icons/NotesIcon";
import SortByIcon from "@/components/icons/SortByIcon";
import Archive from "@/components/pages/Archive";
import Folders from "@/components/pages/Folders";
import Home from "@/components/pages/Home";
import Reminders from "@/components/pages/Reminders";
import Trash from "@/components/pages/Trash";
import { fetchNotes } from "@/utils/actions";
import { motion } from "framer-motion";
import React, { memo, useEffect, useState } from "react";

const page = () => {
  const [currentPage, setCurrentPage] = useState();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash;
      setCurrentPage(currentHash);
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const getNotes = async () => {
    window.dispatchEvent(new Event("loadingStart"));
    const fetchedNotes = await fetchNotes();
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);

    setNotes(fetchedNotes.data);
  };

  useEffect(() => {
    getNotes();
    window.addEventListener("refresh", getNotes);

    return () => window.removeEventListener("refresh", getNotes);
  }, []);

  const Header = memo(() => (
    <div className="starting-div-header">
      <div className="page-header">
        <NotesIcon />
        <h1 className="page-header-title">All Notes</h1>
        <div
          // animate={{ width: "100%" }}
          className="page-header-divider"
        />
        {window.location.hash.replace("#", "").includes("home") ||
        window.location.hash.replace("#", "") === "" ? (
          <motion.div
            className="divider-tools-container"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
          >
            <button onClick={()=> console.log(notes)}>gg</button>
            <div className="divider-tool">
              <SortByIcon />
              <span className="divider-tool-text">Sort by</span>
            </div>
            <div className="divider-tool">
              <LabelIcon />
              <span className="divider-tool-text">Labels</span>
            </div>
          </motion.div>
        ) : window.location.hash.replace("#", "").includes("trash") ? (
          <motion.div
            className="divider-tools-container"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
          >
            <div className="divider-tool">
              <span style={{ color: "rgb(229 98 98)" }} className="divider-tool-text">
                Empty Trash
              </span>
            </div>
          </motion.div>
        ) : (
          <></>
        )}
      </div>
    </div>
  ));

  Header.displayName = "Header";

  const renderPage = () => {
    // switch (currentPage) {
    //   case "trash":
    //     return <Trash notes={notes} setNotes={setNotes} />;
    //   case "home":
    //     return <Home notes={notes} setNotes={setNotes} />;
    //   case "folders":
    //     return <Folders />;
    //   case "archive":
    //     return <Archive notes={notes} setNotes={setNotes} />;
    //   case "reminders":
    //     return <Reminders />;
    //   default:
    //     return <Home notes={notes} setNotes={setNotes} />;
    // }
    if (currentPage?.includes("trash"))
      return <Trash notes={notes} setNotes={setNotes} />;
    else if (currentPage?.includes("home"))
      return <Home notes={notes} setNotes={setNotes} />;
    else if (currentPage?.includes("folders"))
      return <Folders />;
    else if (currentPage?.includes("archive"))
      return <Archive notes={notes} setNotes={setNotes} />;
    else if (currentPage?.includes("reminders"))
      return <Reminders />;
    else
    return <Home notes={notes} setNotes={setNotes} />;
  };

  return (
    <>
      <Header />
      {renderPage()}
    </>
  );
};

export default page;
