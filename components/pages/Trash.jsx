"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Note from "../others/Note";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import { batchDeleteNotes } from "@/utils/actions";

const GUTTER = 15;

const NoteWrapper = memo(
  ({
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
          onClick={(e) => handleNoteClick(e, note, index)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleNoteClick(e, note, index);
            }
          }}
          style={{
            maxWidth: `${isGrid ? 240 : 600}px`,
            minWidth: !isGrid && "15rem",
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
            index={index}
          />
          {/* <p>{index}</p> */}
        </div>
      </motion.div>
    );
  }
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
    isGrid,
  }) => {
    const {
      layout,
      calculateLayoutRef,
      focusedIndex,
      openSnackRef,
      user,
      setDialogInfoRef,
      clientID,
      isExpanded,
    } = useAppContext();
    const userID = user?.id;
    const COLUMN_WIDTH = layout === "grid" ? 240 : 600;
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);

    const notesExist = order.some((uuid, index) => {
      const note = notes.get(uuid);
      if (!note) return false;
      if (!note?.isTrash) return false;
      if (!focusedIndex.current) {
        focusedIndex.current = index;
      }
      return true;
    });

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

        const columns = !isGrid
          ? 1
          : Math.max(1, Math.floor(availableWidth / (COLUMN_WIDTH + GUTTER)));
        const contentWidth = !isGrid
          ? COLUMN_WIDTH
          : columns * (COLUMN_WIDTH + GUTTER) - GUTTER;

        container.style.width = `${contentWidth}px`;
        container.style.maxWidth = isGrid ? "100%" : "90%";
        container.style.position = "relative";
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";

        const items = notesStateRef.current.order.map((uuid, index) => {
          const note = notesStateRef.current.notes.get(uuid);
          return { ...note, index: index };
        });

        const positionItems = (itemList) => {
          const columnHeights = new Array(columns).fill(0);

          itemList.forEach((item) => {
            const wrapper = item.ref?.current?.parentElement;
            if (!wrapper) return;
            const minColumnIndex = columnHeights.indexOf(
              Math.min(...columnHeights)
            );
            const x = minColumnIndex * (COLUMN_WIDTH + GUTTER);
            const y = columnHeights[minColumnIndex];

            wrapper.style.transform = `translate(${x}px, ${y}px)`;
            wrapper.style.position = "absolute";

            columnHeights[minColumnIndex] += wrapper.offsetHeight + GUTTER;
          });

          return Math.max(...columnHeights);
        };

        const totalHeight = positionItems(Array.from(items));
        container.style.height = `${totalHeight}px`;
      });
    }, [isGrid]);

    const debouncedCalculateLayout = useCallback(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        calculateLayout();
      }, 100);
    }, [calculateLayout]);

    useEffect(() => {
      calculateLayoutRef.current = calculateLayout;
    }, [calculateLayout, layout]);

    useEffect(() => {
      calculateLayout();
    }, [visibleItems]);

    const handleEmptyTrash = async () => {
      let deletedNotesUUIDs = [];

      order.map((uuid) => {
        const note = notes.get(uuid);
        if (note?.isTrash) {
          deletedNotesUUIDs.push(uuid);
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
        [() => batchDeleteNotes(deletedNotesUUIDs, clientID)],
        openSnackRef.current
      );
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
          setDialogInfoRef.current({
            func: handleEmptyTrash,
            title: "Empty trash",
            message: "All notes in Trash will be permanently deleted.",
            btnMsg: "Delete",
          });
        }
      };

      window.addEventListener("emptyTrash", handler);

      return () => window.removeEventListener("emptyTrash", handler);
    }, [notes, order]);

    return (
      <>
        <div
          ref={rootContainerRef}
          className={`starting-div ${isExpanded ? "sidebar-expanded" : "sidebar-collapsed"}`}
        >
          <div className="trash-section-header">
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
  }
);

Trash.displayName = "Trash";

export default Trash;
