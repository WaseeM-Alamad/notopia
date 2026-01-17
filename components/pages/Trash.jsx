"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Note from "../others/Note";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import { batchDeleteNotes } from "@/utils/actions";
import SectionHeader from "../others/SectionHeader";

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
      breakpoint,
    } = useAppContext();
    const userID = user?.id;
    const gridNoteWidth = breakpoint === 1 ? 240 : breakpoint === 2 ? 180 : 150;
    const COLUMN_WIDTH = layout === "grid" ? gridNoteWidth : 600;
    const GUTTER = breakpoint === 1 ? 15 : 8;

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
        container.style.maxWidth = isGrid ? "100%" : "95%";
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
    }, [isGrid, COLUMN_WIDTH, GUTTER]);

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
        openSnackRef.current
      );
    };

    useEffect(() => {
      setTimeout(() => {
        calculateLayout();
      }, 0);
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
  }
);

Trash.displayName = "Trash";

export default Trash;
