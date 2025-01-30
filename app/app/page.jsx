"use client";
import ArchiveIcon from "@/components/icons/ArchiveIcon";
import LabelIcon from "@/components/icons/LabelIcon";
import NotesIcon from "@/components/icons/NotesIcon";
import SortByIcon from "@/components/icons/SortByIcon";
import TrashIcon from "@/components/icons/TrashIcon";
import Archive from "@/components/pages/Archive";
import Folders from "@/components/pages/Folders";
import Home from "@/components/pages/Home";
import Reminders from "@/components/pages/Reminders";
import Trash from "@/components/pages/Trash";
import { fetchNotes } from "@/utils/actions";
import { motion } from "framer-motion";
import React, { memo, useEffect, useReducer, useState } from "react";

const initialStates = {
  notes: new Map(),
  order: [],
};

function notesReducer(state, action) {
  switch (action.type) {
    case "SET_INITIAL_DATA":
      return {
        ...state,
        notes: action.notes,
        order: action.order,
      };
      
    case "ADD_NOTE":
      return {
        ...state,
        notes: new Map(state.notes).set(action.newNote.uuid, action.newNote),
        order: [action.newNote.uuid, ...state.order],
      };

      case "PIN_NOTE":
        const pinnedNote = {...action.note, isPinned: !action.note.isPinned};
        const updatedNotesPIN = new Map(state.notes).set(action.note.uuid, pinnedNote);
        const updatedOrderPIN = [...state.order].filter((uuid)=> uuid !== action.note.uuid);
        return {
          ...state,
          notes: updatedNotesPIN,
          order: [action.note.uuid, ...updatedOrderPIN]
        }

        case "ARCHIVE_NOTE": 
        const archivedNote = {...action.note, isArchived: !action.note.isArchived, isPinned: false };
        const updatedNotesArchive = new Map(state.notes).set(action.note.uuid, archivedNote);
        const updatedOrderArchive = [...state.order].filter((uuid)=> uuid !== action.note.uuid);
        return {
          ...state,
          notes: updatedNotesArchive,
          order: [action.note.uuid, ...updatedOrderArchive]
        }
        
    case "DND":
      return {
        ...state,
        order: action.updatedOrder,
      };
  }
}

const page = () => {
  const [currentPage, setCurrentPage] = useState();
  const [isClient, setIsClient] = useState(false);
  const [notesState, dispatchNotes] = useReducer(notesReducer, initialStates);

  useEffect(() => {
    setIsClient(true);
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
    // console.log("initial notes", fetchedNotes.data)
    window.dispatchEvent(new Event("loadingEnd"));

    const notesMap = new Map(
      fetchedNotes.data.map((note) => [note.uuid, note])
    );
    dispatchNotes({
      type: "SET_INITIAL_DATA",
      notes: notesMap,
      order: fetchedNotes.order,
    });
  };

  useEffect(() => {
    getNotes();
    window.addEventListener("refresh", getNotes);

    return () => window.removeEventListener("refresh", getNotes);
  }, []);

  const Header = memo(() => (
    <div className="starting-div-header">
      {isClient && (
        <div className="page-header">
          {/* {window.location.hash.includes("archive") ? (
            <ArchiveIcon size={22} color="#212121" />
          ) : window.location.hash.includes("trash") ? (
            <TrashIcon size={22} color="#212121" />
          ) : (
            <NotesIcon size={34} />
          )} */}
          <h1 className="page-header-title">
            {window.location.hash.includes("archive") ? (
              <span>Archive</span>
            ) : window.location.hash.includes("trash") ? (
              <span>Trash</span>
            ) : (
              <span>All Notes</span>
            )}
          </h1>
          <div
          // animate={{ width: "100%" }}
          // className="page-header-divider"
          />
          <div className="divider-tools-container">
            <div className="divider-tool">
              <SortByIcon />
              <span className="divider-tool-text">Sort by</span>
            </div>
            <div className="divider-tool">
              <LabelIcon />
              <span className="divider-tool-text">Labels</span>
            </div>
          </div>
        </div>
      )}
    </div>
  ));

  Header.displayName = "Header";

  const renderPage = () => {
    if (currentPage?.includes("trash"))
      return (
        <Trash
          notes={notes}
          setNotes={setNotes}
          order={order}
          setOrder={setOrder}
        />
      );
    else if (currentPage?.includes("home"))
      return (
        <Home
          dispatchNotes={dispatchNotes}
          notes={notesState.notes}
          order={notesState.order}
        />
      );
    else if (currentPage?.includes("folders")) return <Folders />;
    else if (currentPage?.includes("archive"))
      return (
        <Archive
          notes={notes}
          setNotes={setNotes}
          order={order}
          setOrder={setOrder}
        />
      );
    else if (currentPage?.includes("reminders")) return <Reminders />;
    else
      return (
        <Home
          dispatchNotes={dispatchNotes}
          notes={notesState.notes}
          order={notesState.order}
        />
      );
  };

  return (
    <>
      <Header />
      {renderPage()}
    </>
  );
};

export default page;
