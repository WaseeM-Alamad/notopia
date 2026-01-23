"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Note from "../others/Note";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import { batchDeleteNotes } from "@/utils/actions";
import SectionHeader from "../others/SectionHeader";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLayout } from "@/context/LayoutContext";
import { useMasonry } from "@/context/MasonryContext";

const NoteWrapper = memo(
  ({
    gridNoteWidth,
    GUTTER,
    isGrid,
    note,
    noteActions,
    selectedNotesRef,
    ref,
    setSelectedNotesIDs,
    dispatchNotes,
    selectedNotes,
    index,
    handleSelectNote,
    handleNoteClick,
    fadingNotes,
  }) => {
    const [mounted, setMounted] = useState(false);
    const touchDownRef = useRef(null);

    useEffect(() => {
      requestAnimationFrame(() => {
        setMounted(true);
      });
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, type: "tween" }}
      >
        <div
          ref={ref}
          className={`grid-item ${
            fadingNotes.has(note?.uuid) ? "fade-out" : ""
          }`}
          onClick={(e) =>
            !touchDownRef.current && handleNoteClick(e, note, index)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              !touchDownRef.current && handleNoteClick(e, note, index);
            }
          }}
          style={{
            maxWidth: `${isGrid ? gridNoteWidth : 600}px`,
            width: "100%",
            marginBottom: `${GUTTER}px`,
            transition: `transform ${
              mounted ? "0.22s" : "0"
            } cubic-bezier(0.5, 0.2, 0.3, 1), opacity 0s`,
          }}
        >
          <Note
            note={note}
            selectedNotesRef={selectedNotesRef}
            noteActions={noteActions}
            setSelectedNotesIDs={setSelectedNotesIDs}
            selectedNotes={selectedNotes}
            dispatchNotes={dispatchNotes}
            handleSelectNote={handleSelectNote}
            handleNoteClick={handleNoteClick}
            touchDownRef={touchDownRef}
          />
          {/* <p>{index}</p> */}
        </div>
      </motion.div>
    );
  },
);

NoteWrapper.displayName = "NoteWrapper";

const Trash = memo(
  ({
    visibleItems,
    selectedNotesRef,
    notesStateRef,
    notes,
    order,
    dispatchNotes,
    setSelectedNotesIDs,
    handleSelectNote,
    handleNoteClick,
    noteActions,
    notesReady,
    rootContainerRef,
    setFadingNotes,
    fadingNotes,
    containerRef,
  }) => {
    const { openSnackRef, user, setDialogInfoRef, clientID } = useAppContext();
    const { gridNoteWidth, GUTTER, isGrid, notesExist } = useMasonry();
    const userID = user?.id;

    const handleEmptyTrash = async () => {
      const deletedNotesUUIDs = [];
      const deletedNotesData = [];

      order.map((uuid) => {
        const note = notes.get(uuid);
        if (note?.isTrash) {
          deletedNotesUUIDs.push(uuid);
          deletedNotesData.push({
            noteUUID: uuid,
            creatorID: note?.creator?._id,
          });
        }
      });

      setFadingNotes(new Set(deletedNotesUUIDs));
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "EMPTY_TRASH",
      });
      setTimeout(() => {
        dispatchNotes({ type: "EMPTY_TRASH" });
        setFadingNotes(new Set());
      }, 250);

      handleServerCall(
        [() => batchDeleteNotes(deletedNotesData, clientID)],
        openSnackRef.current,
      );
    };

    useEffect(() => {
      const handler = async () => {
        const trashNotes = order.some(
          (uuid) => notes.get(uuid).isTrash === true,
        );

        if (trashNotes) {
          setDialogInfoRef.current({
            func: handleEmptyTrash,
            title: "Empty Trash",
            message: "All notes in Trash will be permanently deleted.",
            btnMsg: "Empty Trash",
          });
        }
      };

      window.addEventListener("emptyTrash", handler);

      return () => window.removeEventListener("emptyTrash", handler);
    }, [notes, order]);

    return (
      <>
        <div ref={rootContainerRef} className="starting-div">
          <SectionHeader title="Trash" iconClass="section-trash-icon" />
          <div id="trash-header" className="trash-section-header">
            Notes in Trash are deleted after 7 days.
          </div>
          <div ref={containerRef} className="section-container">
            {order.map((uuid, index) => {
              const note = notes.get(uuid);
              if (!visibleItems.has(note?.uuid)) return null;
              if (note?.isTrash)
                return (
                  <NoteWrapper
                    isGrid={isGrid}
                    key={note?.uuid}
                    note={note}
                    selectedNotesRef={selectedNotesRef}
                    noteActions={noteActions}
                    dispatchNotes={dispatchNotes}
                    index={index}
                    setSelectedNotesIDs={setSelectedNotesIDs}
                    handleSelectNote={handleSelectNote}
                    handleNoteClick={handleNoteClick}
                    fadingNotes={fadingNotes}
                    gridNoteWidth={gridNoteWidth}
                    GUTTER={GUTTER}
                  />
                );
            })}
          </div>
          <div style={{ display: notesExist && "none" }} className="empty-page">
            {notesReady && !notesExist && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 800,
                  damping: 50,
                  mass: 1,
                }}
                className="empty-page-box"
              >
                <div className="empty-page-trash" />
                No notes in trash
              </motion.div>
            )}
            {!notesReady && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 800,
                  damping: 50,
                  mass: 1,
                }}
                className="empty-page-box"
              >
                <div className="empty-page-loading" />
                Loading notes...
              </motion.div>
            )}
          </div>
        </div>
      </>
    );
  },
);

Trash.displayName = "Trash";

export default Trash;
