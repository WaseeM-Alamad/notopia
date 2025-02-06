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

    case "PIN_NOTE": {
      const newNote = { ...action.note, isPinned: !action.note.isPinned };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note.uuid, ...updatedOrder],
      };
    }
    case "ARCHIVE_NOTE": {
      const newNote = {
        ...action.note,
        isArchived: !action.note.isArchived,
        isPinned: false,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note.uuid, ...updatedOrder],
      };
    }
    case "UNDO_ARCHIVE": {
      const newNote = {
        ...action.note,
        isArchived: action.note.isArchived,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order];
      const [targetedNote] = updatedOrder.splice(0, 1);
      updatedOrder.splice(action.initialIndex, 0, targetedNote);

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }
    case "TRASH_NOTE": {
      const newNote = {
        ...action.note,
        isTrash: !action.note.isTrash,
        isPinned: false,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note.uuid, ...updatedOrder],
      };
    }
    case "UNDO_TRASH": {
      const newNote = {
        ...action.note,
        isTrash: action.note.isTrash,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order];
      const [targetedNote] = updatedOrder.splice(0, 1);
      updatedOrder.splice(action.initialIndex, 0, targetedNote);

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }
    case "DELETE_NOTE": {
      const newNote = new Map(state.notes);
      newNote.delete(action.note.uuid);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: newNote,
        order: updatedOrder,
      };
    }
    case "PIN_ARCHIVED_NOTE": {
      const newNote = {
        ...action.note,
        isPinned: true,
        isArchived: false,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.note.uuid
      );
      return {
        ...state,
        notes: updatedNotes,
        order: [action.note.uuid, ...updatedOrder],
      };
    }
    case "UNDO_PIN_ARCHIVED": {
      const newNote = {
        ...action.note,
        isPinned: false,
        isArchived: true,
      };

      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);

      const updatedOrder = [...state.order];
      const [targetedNote] = updatedOrder.splice(0, 1);
      updatedOrder.splice(action.initialIndex, 0, targetedNote);

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }
    case "UPDATE_COLOR": {
      const newNote = { ...action.note, color: action.newColor };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);

      return {
        ...state,
        notes: updatedNotes,
      };
    }
    case "ADD_IMAGE": {
      const newNote = {
        ...action.note,
        images: [
          ...action.note.images,
          { url: action.imageURL, uuid: action.newImageUUID },
        ],
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);

      return {
        ...state,
        notes: updatedNotes,
      };
    }
    case "UPDATE_TEXT": {
      const newNote = {
        ...action.note,
        title: action.newTitle,
        content: action.newContent,
      };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }
    case "UPDATE_IMAGES": {
      const newNote = { ...action.note, images: action.newImages };
      const updatedNotes = new Map(state.notes).set(action.note.uuid, newNote);
      return {
        ...state,
        notes: updatedNotes,
      };
    }

    case "UNDO_COPY": {
      const updatedNotes = new Map(state.notes);
      updatedNotes.delete(action.noteUUID);
      const updatedOrder = [...state.order].filter(
        (uuid) => uuid !== action.noteUUID
      );

      return {
        ...state,
        notes: updatedNotes,
        order: updatedOrder,
      };
    }

    case "DND": {
      return {
        ...state,
        order: action.updatedOrder,
      };
    }
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
  const [unloadWarn, setUnloadWarn] = useState(false);
  const undoFunction = useRef(() => {});
  const onCloseFunction = useRef(() => {});

  const openSnackFunction = useCallback((data) => {
    if (data.close) {
      setSnackbarState((prev) => ({
        ...prev,
        snackOpen: false,
      }));
      onCloseFunction.current();
    } else {
      setSnackbarState((prev) => ({
        ...prev,
        snackOpen: false,
      }));
      onCloseFunction.current();

      setTimeout(() => {
        setSnackbarState({
          message: data.snackMessage,
          showUndo: true,
          snackOpen: true,
        });
        if (data.snackOnUndo !== undefined) {
          undoFunction.current = data.snackOnUndo;
        }
        if (data.snackOnClose !== undefined) {
          onCloseFunction.current = data.snackOnClose;
        }
        if (data.unloadWarn) {
          setUnloadWarn(true);
        }
      }, 80);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      openSnackFunction({ close: true });
    };

    window.addEventListener("sectionChange", handler);

    return () => window.removeEventListener("sectionChange", handler);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (unloadWarn) {
        const message =
          "Your request is still in progress. Are you sure you want to leave?";
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unloadWarn]);

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
        <div className="page-header">
          {window?.location?.hash?.includes("archive") ? (
            <ArchiveIcon size={22} color="#212121" />
          ) : window?.location?.hash?.includes("trash") ? (
            <TrashIcon size={22} color="#212121" />
          ) : (
            <NotesIcon size={34} />
          )}
          <h1 className="page-header-title">
            {window?.location?.hash?.includes("archive") ? (
              <span>Archive</span>
            ) : window?.location?.hash?.includes("trash") ? (
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
          setTooltipAnchor={setTooltipAnchor}
          openSnackFunction={openSnackFunction}
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
        undo={undoFunction}
        unloadWarn={unloadWarn}
        setUnloadWarn={setUnloadWarn}
        onClose={onCloseFunction}
      />
      <Header />
      {renderPage()}
    </>
  );
};

export default page;
