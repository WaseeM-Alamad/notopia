"use client";
import Archive from "@/components/pages/Archive";
import Folders from "@/components/pages/Folders";
import Home from "@/components/pages/Home";
import Reminders from "@/components/pages/Reminders";
import Trash from "@/components/pages/Trash";
import { fetchNotes } from "@/utils/actions";
import React, { useEffect, useState } from "react";

const page = () => {
  const [currentPage, setCurrentPage] = useState();
  const [initialNotes, setInitialNotes] = useState([]);

  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash.replace("#", "");
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

    setInitialNotes(fetchedNotes.data);
  };

  useEffect(() => {
    getNotes();
    window.addEventListener("refresh", getNotes);

    return () => window.removeEventListener("refresh", getNotes);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "trash":
        return <Trash initialNotes={initialNotes} />;
      case "home":
        return <Home initialNotes={initialNotes} />;
      case "folders":
        return <Folders />;
      case "archive":
        return <Archive />;
      case "reminders":
        return <Reminders />;
      default:
        return <Home initialNotes={initialNotes} />;
    }
  };

  return <>{renderPage()}</>;
};

export default page;
