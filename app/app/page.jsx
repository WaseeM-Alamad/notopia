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
import Snackbar from "@/components/Tools/Snackbar";
import Tooltip from "@/components/Tools/Tooltip";
import { fetchNotes } from "@/utils/actions";
import { motion } from "framer-motion";
import React, {
  memo,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

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
      const pinnedNote = { ...action.note, isPinned: !action.note.isPinned };
      const updatedNotesPIN = new Map(state.notes).set(
        action.note.uuid,
        pinnedNote
      );
      const updatedOrderPIN = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotesPIN,
        order: [action.note.uuid, ...updatedOrderPIN],
      };

    case "ARCHIVE_NOTE":
      const archivedNote = {
        ...action.note,
        isArchived: !action.note.isArchived,
        isPinned: false,
      };
      const updatedNotesArchive = new Map(state.notes).set(
        action.note.uuid,
        archivedNote
      );
      const updatedOrderArchive = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotesArchive,
        order: [action.note.uuid, ...updatedOrderArchive],
      };

    case "UNDO_ARCHIVE":
      const newUndoArchiveNote = {
        ...action.note,
        isArchived: action.note.isArchived,
      };
      const updatedNotesUndoArch = new Map(state.notes).set(
        action.note.uuid,
        newUndoArchiveNote
      );
      const updatedOrderUndoArch = [...state.order];
      const [UndoArchiveNote] = updatedOrderUndoArch.splice(0, 1);
      updatedOrderUndoArch.splice(action.initialIndex, 0, UndoArchiveNote);

      return {
        ...state,
        notes: updatedNotesUndoArch,
        order: updatedOrderUndoArch,
      };

    case "TRASH_NOTE":
      const trashNote = {
        ...action.note,
        isTrash: !action.note.isTrash,
        isPinned: false,
      };
      const updatedNotesTrash = new Map(state.notes).set(
        action.note.uuid,
        trashNote
      );
      const updatedOrderTrash = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotesTrash,
        order: [action.note.uuid, ...updatedOrderTrash],
      };
    case "DELETE_NOTE":
      const updatedNotesDelete = new Map(state.notes);
      updatedNotesDelete.delete(action.note.uuid);
      const updatedOrderDelete = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotesDelete,
        order: updatedOrderDelete,
      };

    case "PIN_ARCHIVED_NOTE":
      const pinnedArchivedNote = {
        ...action.note,
        isPinned: true,
        isArchived: false,
      };
      const updatedNotesPinArch = new Map(state.notes).set(
        action.note.uuid,
        pinnedArchivedNote
      );
      const updatedOrderPinArch = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotesPinArch,
        order: [action.note.uuid, ...updatedOrderPinArch],
      };

    case "UPDATE_COLOR":
      const newColorNote = { ...action.note, color: action.newColor };
      const updatedNotesColor = new Map(state.notes).set(
        action.note.uuid,
        newColorNote
      );

      return {
        ...state,
        notes: updatedNotesColor,
      };

    case "ADD_IMAGE":
      const noteImage = {
        ...action.note,
        images: [
          ...action.note.images,
          { url: action.imageURL, uuid: action.newImageUUID },
        ],
      };
      const updatedNotesImage = new Map(state.notes).set(
        action.note.uuid,
        noteImage
      );

      return {
        ...state,
        notes: updatedNotesImage,
      };

    case "UPDATE_TEXT":
      const TextNote = {
        ...action.note,
        title: action.newTitle,
        content: action.newContent,
      };
      const updatedNotesTextImg = new Map(state.notes).set(
        action.note.uuid,
        TextNote
      );
      return {
        ...state,
        notes: updatedNotesTextImg,
      };

    case "UPDATE_IMAGES":
      const ImagesNote = { ...action.note, images: action.newImages };
      const updatedNotesImages = new Map(state.notes).set(
        action.note.uuid,
        ImagesNote
      );
      return {
        ...state,
        notes: updatedNotesImages,
      };

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
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [notesState, dispatchNotes] = useReducer(notesReducer, initialStates);
  const [snackbarState, setSnackbarState] = useState({
    snackOpen: false,
    showUndo: true,
    message: "",
  });
  const undoFunction = useRef(null);

  const openSnackFunction = useCallback((Rmessage, Rfunction) => {
    setSnackbarState((prev) => ({
      ...prev,
      snackOpen: false,
    }));

    setTimeout(() => {
      setSnackbarState({
        message: Rmessage,
        showUndo: true,
        snackOpen: true,
      });
      undoFunction.current = Rfunction;
    }, 80);
  }, []);

  useEffect(() => {
    setIsClient(true);
    const handleHashChange = () => {
      const currentHash = window.location.hash;

      // console.log("HASH CHANGE")
      setTooltipAnchor(null);
      setTimeout(() => {
        setCurrentPage(currentHash);  
      }, 0);
      
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
          dispatchNotes={dispatchNotes}
          notes={notesState.notes}
          order={notesState.order}
        />
      );
    else if (currentPage?.includes("home"))
      return (
        <Home
          dispatchNotes={dispatchNotes}
          notes={notesState.notes}
          order={notesState.order}
          setTooltipAnchor={setTooltipAnchor}
          openSnackFunction={openSnackFunction}
        />
      );
    else if (currentPage?.includes("folders")) return <Folders />;
    else if (currentPage?.includes("archive"))
      return (
        <Archive
          dispatchNotes={dispatchNotes}
          notes={notesState.notes}
          order={notesState.order}
          setTooltipAnchor={setTooltipAnchor}
          openSnackFunction={openSnackFunction}
        />
      );
    else if (currentPage?.includes("reminders")) return <Reminders />;
    else
      return (
        <Home
          dispatchNotes={dispatchNotes}
          notes={notesState.notes}
          order={notesState.order}
          setTooltipAnchor={setTooltipAnchor}
          openSnackFunction={openSnackFunction}
        />
      );
  };

  return (
    <>
      {tooltipAnchor?.display && <Tooltip anchorEl={tooltipAnchor} />}
      <Snackbar
        snackbarState={snackbarState}
        setSnackbarState={setSnackbarState}
        setTooltipAnchor={setTooltipAnchor}
        undo={undoFunction.current}
      />
      <Header />
      {renderPage()}
    </>
  );
};

export default page;
