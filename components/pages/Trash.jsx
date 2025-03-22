"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import "@/assets/styles/home.css";
import Note from "../others/Note";
import AddNoteModal from "../others/AddNoteModal";
import { AnimatePresence, motion } from "framer-motion";
import TopMenuHome from "../others/topMenu/TopMenu";
import { emptyTrashAction } from "@/utils/actions";
import DeleteModal from "../others/DeleteModal";

const COLUMN_WIDTH = 240;
const GUTTER = 15;

const NoteWrapper = memo(
  ({
    note,
    noteActions,
    ref,
    setSelectedNotesIDs,
    dispatchNotes,
    selectedNotes,
    index,
    setTooltipAnchor,
    openSnackFunction,
  }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setTimeout(() => {
        setMounted(true);
      }, 100);
    }, []);

    return (
      <motion.div
        ref={ref}
        className="grid-item"
        style={{
          width: `${COLUMN_WIDTH}px`,
          marginBottom: `${GUTTER}px`,
          transition: `transform ${mounted ? "0.2s" : "0"} ease`,
        }}
      >
        <Note
          note={note}
          noteActions={noteActions}
          setSelectedNotesIDs={setSelectedNotesIDs}
          selectedNotes={selectedNotes}
          dispatchNotes={dispatchNotes}
          setTooltipAnchor={setTooltipAnchor}
          openSnackFunction={openSnackFunction}
          index={index}
        />
        {/* <p>{index}</p> */}
      </motion.div>
    );
  }
);

NoteWrapper.displayName = "NoteWrapper";

const Home = memo(
  ({
    notes,
    order,
    dispatchNotes,
    setTooltipAnchor,
    openSnackFunction,
    selectedNotesIDs,
    setSelectedNotesIDs,
    noteActions,
    notesReady,
  }) => {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [notesExist, setNotesExist] = useState(false);
    const containerRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);

    const calculateLayout = useCallback(() => {
      if (layoutFrameRef.current) {
        cancelAnimationFrame(layoutFrameRef.current);
      }

      layoutFrameRef.current = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const parent = container.parentElement;
        const parentWidth = parent.clientWidth;
        const style = window.getComputedStyle(parent);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const availableWidth = parentWidth - paddingLeft - paddingRight;

        const columns = Math.max(
          1,
          Math.floor(availableWidth / (COLUMN_WIDTH + GUTTER))
        );
        const contentWidth = columns * (COLUMN_WIDTH + GUTTER) - GUTTER;

        container.style.width = `${contentWidth}px`;
        container.style.maxWidth = "100%";
        container.style.position = "relative";
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";

        const items = container.children;
        setNotesExist(items.length > 0);

        const positionItems = (itemList) => {
          const columnHeights = new Array(columns).fill(0);

          itemList.forEach((item) => {
            const minColumnIndex = columnHeights.indexOf(
              Math.min(...columnHeights)
            );
            const x = minColumnIndex * (COLUMN_WIDTH + GUTTER);
            const y = columnHeights[minColumnIndex];

            item.style.transform = `translate(${x}px, ${y}px)`;
            item.style.position = "absolute";

            columnHeights[minColumnIndex] += item.offsetHeight + GUTTER;
          });

          return Math.max(...columnHeights);
        };

        const totalHeight = positionItems(Array.from(items));
        container.style.height = `${totalHeight}px`;
      });
    }, []);

    const debouncedCalculateLayout = useCallback(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        calculateLayout();
      }, 100);
    }, [calculateLayout]);

    const handleEmptyTrash = async () => {
      const notes = containerRef.current.querySelectorAll(".grid-item");
      for (const note of notes) {
        if (!note) return;
        note.classList.add("fade-out");
      }

      const lastNote = notes[notes.length - 1];

      const handleTransitionEnd = async (e) => {
        if (e.propertyName === "opacity") {
          dispatchNotes({ type: "EMPTY_TRASH" });
          lastNote.removeEventListener("transitionend", handleTransitionEnd);
        }
      };

      if (lastNote) {
        lastNote.addEventListener("transitionend", handleTransitionEnd);
      }
      window.dispatchEvent(new Event("loadingStart"));
      await emptyTrashAction();
      window.dispatchEvent(new Event("loadingEnd"));
    };

    useEffect(() => {
      calculateLayout();
      window.addEventListener("resize", debouncedCalculateLayout);

      return () => {
        window.removeEventListener("resize", debouncedCalculateLayout);
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
        if (layoutFrameRef.current) {
          cancelAnimationFrame(layoutFrameRef.current);
        }
      };
    }, [calculateLayout, debouncedCalculateLayout, notes]);

    useEffect(() => {
      if (notes.length > 0) {
        const timer = setTimeout(calculateLayout, 50);
        return () => clearTimeout(timer);
      }
    }, [notes, calculateLayout]);


    useEffect(() => {
      const handler = async () => {
        const trashNotes = order.some(
          (uuid) => notes.get(uuid).isTrash === true
        );

        if (trashNotes) {
          setDeleteModalOpen(true);
        }
      };

      window.addEventListener("emptyTrash", handler);

      return () => window.removeEventListener("emptyTrash", handler);
    }, [notes, order]);

    return (
      <>
        <div className="starting-div">
          <div className="trash-section-header">
            Notes in Trash are deleted after 7 days.
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            ref={containerRef}
            className="section-container"
          >
            {order.map((uuid, index) => {
              const note = notes.get(uuid);
              if (note.isTrash)
                return (
                  <NoteWrapper
                    key={note.uuid}
                    note={note}
                    noteActions={noteActions}
                    dispatchNotes={dispatchNotes}
                    index={index}
                    setSelectedNotesIDs={setSelectedNotesIDs}
                    setTooltipAnchor={setTooltipAnchor}
                    openSnackFunction={openSnackFunction}
                  />
                );
            })}
          </motion.div>
          <div className="empty-page">
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
        <AddNoteModal
          trigger={false}
          dispatchNotes={dispatchNotes}
          setTrigger={() => {}}
          lastAddedNoteRef={null}
          openSnackFunction={openSnackFunction}
        />
        <AnimatePresence>
          {deleteModalOpen && (
            <DeleteModal
              setIsOpen={setDeleteModalOpen}
              handleDelete={handleEmptyTrash}
              title="Empty trash"
              message={
                "All notes in Trash will be permanently deleted."
              }
            />
          )}
        </AnimatePresence>
      </>
    );
  }
);

Home.displayName = "Home";

export default Home;
