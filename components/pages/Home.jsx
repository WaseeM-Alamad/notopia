"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Note from "../others/Note";
import { motion } from "framer-motion";
import { updateOrderAction } from "@/utils/actions";
import ComposeNote from "../others/ComposeNote";
import { useAppContext } from "@/context/AppContext";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import { useNoteDragging } from "@/hooks/useNoteDragging";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLayout } from "@/context/LayoutContext";

const GAP_BETWEEN_SECTIONS = 88;

const NoteWrapper = memo(
  ({
    GUTTER,
    isGrid,
    dispatchNotes,
    selectedNotesRef,
    note,
    overIndexRef,
    overIsPinnedRef,
    noteActions,
    fadingNotes,
    setFadingNotes,
    setSelectedNotesIDs,
    handleDragStart,
    notesIndexMapRef,
    handleSelectNote,
    handleNoteClick,
    gridNoteWidth,
    isDraggingRef,
    touchOverElementRef,
  }) => {
    const [mounted, setMounted] = useState(false);
    const noteRef = useRef(null);
    const touchDownRef = useRef(null);

    useEffect(() => {
      requestAnimationFrame(() => {
        setMounted(true);
      });
    }, []);

    let startX, startY;

    const handleMouseDown = (e) => {
      if (e.button !== 0) {
        return;
      }

      startX = e.clientX;
      startY = e.clientY;
      const targetElement = e.currentTarget;
      const target = e.target;

      const detectDrag = (event) => {
        const deltaX = Math.abs(event.clientX - startX);
        const deltaY = Math.abs(event.clientY - startY);

        if (deltaX > 5 || deltaY > 5) {
          if (
            targetElement === noteRef.current &&
            !target.classList.contains("not-draggable")
          ) {
            handleDragStart(
              e,
              targetElement,
              notesIndexMapRef.current.get(note.uuid),
              note?.isPinned,
            );
          }
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", detectDrag);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", detectDrag);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseEnter = () => {
      overIndexRef.current = notesIndexMapRef.current.get(note.uuid);
      overIsPinnedRef.current = note?.isPinned;
    };

    const startDragging = () => {
      const targetElement = noteRef.current;

      const detectDrag = (event) => {
        event.preventDefault();

        const t = event.touches[0];
        if (!t) return;

        document.body.classList.add("dragging");
        requestAnimationFrame(() => {
          handleDragStart(
            {
              clientX: t.clientX,
              clientY: t.clientY,
            },
            targetElement,
            notesIndexMapRef.current.get(note.uuid),
            note?.isPinned,
            true,
          );
        });
      };

      const handleTouchEnd = () => {
        document.removeEventListener("touchmove", detectDrag);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("touchcancel", handleTouchEnd);
      };

      document.addEventListener("touchmove", detectDrag, { passive: false });
      document.addEventListener("touchend", handleTouchEnd, { passive: true });
      document.addEventListener("touchcancel", handleTouchEnd, {
        passive: true,
      });
    };

    useEffect(() => {
      const handleDetectTouchOverlap = (e) => {
        // e.preventDefault();
        if (
          !isDraggingRef.current ||
          touchOverElementRef.current === noteRef.current
        ) {
          return;
        }
        const t = e.touches[0];
        const touchX = t.clientX;
        const touchY = t.clientY;
        const element = document.elementFromPoint(touchX, touchY);

        if (noteRef.current.contains(element)) {
          handleMouseEnter();
          touchOverElementRef.current = noteRef.current;
        }
      };

      document.addEventListener("touchmove", handleDetectTouchOverlap, {
        passive: false,
      });

      return () =>
        document.removeEventListener("touchmove", handleDetectTouchOverlap, {
          passive: false,
        });
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, type: "tween" }}
        className="top-note-wrapper"
      >
        <div
          tabIndex={0}
          ref={noteRef}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          // onTouchEnd={() =>
          //   document.removeEventListener("touchmove", handleDetectTouchOverlap)
          // }
          onClick={(e) =>
            !touchDownRef.current &&
            handleNoteClick(e, note, notesIndexMapRef.current.get(note.uuid))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              !touchDownRef.current &&
                handleNoteClick(
                  e,
                  note,
                  notesIndexMapRef.current.get(note.uuid),
                );
            }
          }}
          className={`grid-item ${
            fadingNotes.has(note?.uuid) ? "fade-out" : ""
          }`}
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
            dispatchNotes={dispatchNotes}
            selectedNotesRef={selectedNotesRef}
            note={note}
            noteActions={noteActions}
            setFadingNotes={setFadingNotes}
            setSelectedNotesIDs={setSelectedNotesIDs}
            handleSelectNote={handleSelectNote}
            handleNoteClick={handleNoteClick}
            touchDownRef={touchDownRef}
            startDragging={startDragging}
          />
          {/* <p style={{position: "absolute", bottom: "40px", color: "blue"}}>{notesIndexMapRef.current.get(note.uuid)}</p> */}
        </div>
      </motion.div>
    );
  },
);

NoteWrapper.displayName = "NoteWrapper";

const Home = memo(
  ({
    visibleItems,
    selectedNotesRef,
    setVisibleItems,
    notes,
    order,
    fadingNotes,
    setFadingNotes,
    dispatchNotes,
    handleNoteClick,
    setSelectedNotesIDs,
    handleSelectNote,
    noteActions,
    notesReady,
    containerRef,
    rootContainerRef,
  }) => {
    const { user, focusedIndex, notesStateRef, notesIndexMapRef } =
      useAppContext();
    const { layout, breakpoint } = useLayout();
    const { calculateLayoutRef } = useGlobalContext();
    const userID = user?.id;
    const [pinnedHeight, setPinnedHeight] = useState(null);
    const lastAddedNoteRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);
    const [layoutReady, setLayoutReady] = useState(false);
    const [isGrid, setIsGrid] = useState(layout);
    const gridNoteWidth = breakpoint === 1 ? 240 : breakpoint === 2 ? 180 : 150;
    const COLUMN_WIDTH = isGrid ? gridNoteWidth : 600;
    const GUTTER = breakpoint === 1 ? 15 : 8;
    const touchOverElementRef = useRef(null);
    const overIndexRef = useRef(null);
    const overIsPinnedRef = useRef(null);
    const isDraggingRef = useRef(false);
    const handleDragStartRef = useRef(null);

    useEffect(()=> {
      setTimeout(() => {
        setIsGrid(layout === "grid");
      }, 10);
    }, [layout])

    const hasPinned = [...visibleItems].some((uuid) => {
      const note = notes.get(uuid);
      return note?.isPinned;
    });

    const hasUnpinned = [...visibleItems].some((uuid) => {
      const note = notes.get(uuid);
      if (!note) return false;
      return !note?.isPinned;
    });

    const notesExist = order.some((uuid, index) => {
      const note = notes.get(uuid);
      if (!note) return false;
      if (note?.isArchived || note?.isTrash) return false;
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

        // Get all the items in the container
        // const items = Array.from(container.children);
        const items = notesStateRef.current.order.map((uuid, index) => {
          const note = notesStateRef.current.notes.get(uuid);
          return { ...note, index: index };
        });

        // Sort items based on their position value (ascending order)
        const sortedItems = items.sort((a, b) => {
          return a.index - b.index; // Ascending order
        });

        // Filter out pinned and unpinned items
        const pinnedItems = sortedItems.filter((item) => {
          if (item.isTrash || item.isArchived) return false;
          return item.isPinned === true;
        });
        const unpinnedItems = sortedItems.filter((item) => {
          if (item.isTrash || item.isArchived) return false;
          return item.isPinned === false;
        });

        const positionItems = (itemList, startY = 0) => {
          const columnHeights = new Array(columns).fill(startY);

          itemList.forEach((item) => {
            const wrapper = item.ref?.current?.parentElement;

            if (!wrapper) {
              return;
            }

            const minColumnIndex = columnHeights.indexOf(
              Math.min(...columnHeights),
            );
            const x = minColumnIndex * (COLUMN_WIDTH + GUTTER);
            const y = columnHeights[minColumnIndex];

            wrapper.style.transform = `translate(${x}px, ${y}px)`;
            wrapper.style.position = "absolute";

            columnHeights[minColumnIndex] += wrapper.offsetHeight + GUTTER;
          });

          return Math.max(...columnHeights);
        };

        // Gap between pinned and unpinned sections
        const gapBetweenSections =
          pinnedItems.length > 0 ? GAP_BETWEEN_SECTIONS : 0;
        const pinnedHeight = positionItems(
          pinnedItems,
          pinnedItems.length > 0 && 30,
        );
        const unpinnedHeight = positionItems(
          unpinnedItems,
          pinnedHeight + gapBetweenSections,
        );

        setPinnedHeight(pinnedHeight - 16);
        container.style.height = `${unpinnedHeight}px`;
        requestAnimationFrame(() => {
          setLayoutReady(true);
        });
      });
    }, [isGrid, COLUMN_WIDTH, GUTTER]);

    useEffect(() => {
      calculateLayoutRef.current = calculateLayout;
    }, [calculateLayout]);

    const debouncedCalculateLayout = useCallback(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        calculateLayout();
      }, 100);
    }, [calculateLayout]);

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
    }, [calculateLayout, debouncedCalculateLayout, notes, order]);

    useEffect(() => {
      if (notes.length > 0) {
        const timer = setTimeout(calculateLayout, 50);
        return () => clearTimeout(timer);
      }
    }, [notes, calculateLayout]);

    useEffect(() => {
      calculateLayout();
    }, [visibleItems]);

    const getLastRef = () => {
      let lastRef = null;
      for (let uuid of order) {
        const note = notes.get(uuid);
        if (!note?.isArchived && !note?.isTrash) {
          lastRef = note?.ref.current;
          lastAddedNoteRef.current = lastRef;
          return lastRef;
        }
      }
    };

    useNoteDragging({
      touchOverElementRef,
      handleDragStartRef,
      calculateLayout,
      isDraggingRef,
      notesStateRef,
      overIsPinnedRef,
      overIndexRef,
      dispatchNotes,
    });

    useEffect(() => {
      getLastRef();
    }, [notes, order]);

    return (
      <>
        <div ref={rootContainerRef} className="starting-div">
          {/* <button
            style={{ position: "fixed" }}
            onClick={() => {
              const containerBottom =
                containerRef.current.getBoundingClientRect().bottom +
                window.scrollY;
              console.log("containerBottom", containerBottom);
            }}
          >
            gg
          </button> */}
          <div
            ref={containerRef}
            className="section-container"
            style={{ opacity: !layoutReady && "0" }}
            // onMouseMove={handleMouseMove}
          >
            <p
              className="section-label"
              style={{
                // top: "33px",
                opacity: hasPinned ? "1" : "0",
                display: visibleItems.size === 0 && "none",
              }}
            >
              PINNED
            </p>
            <p
              className="section-label"
              style={{
                top: `${pinnedHeight + GAP_BETWEEN_SECTIONS + 2}px`,
                opacity: hasPinned && hasUnpinned ? "1" : "0",
                display: visibleItems.size === 0 && "none",
              }}
            >
              OTHERS
            </p>

            {order.map((uuid, index) => {
              const note = notes.get(uuid);
              if (!visibleItems.has(note?.uuid)) return null;

              return (
                !note?.isArchived &&
                !note?.isTrash && (
                  <NoteWrapper
                    selectedNotesRef={selectedNotesRef}
                    key={note?.uuid || index}
                    note={note}
                    isGrid={isGrid}
                    overIndexRef={overIndexRef}
                    overIsPinnedRef={overIsPinnedRef}
                    fadingNotes={fadingNotes}
                    setFadingNotes={setFadingNotes}
                    noteActions={noteActions}
                    dispatchNotes={dispatchNotes}
                    handleDragStart={handleDragStartRef.current}
                    notesIndexMapRef={notesIndexMapRef}
                    setSelectedNotesIDs={setSelectedNotesIDs}
                    handleNoteClick={handleNoteClick}
                    handleSelectNote={handleSelectNote}
                    gridNoteWidth={gridNoteWidth}
                    GUTTER={GUTTER}
                    isDraggingRef={isDraggingRef}
                    touchOverElementRef={touchOverElementRef}
                  />
                )
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
                <div className="empty-page-home" />
                Notes you add appear here
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
        <ComposeNote
          dispatchNotes={dispatchNotes}
          setVisibleItems={setVisibleItems}
          containerRef={containerRef}
          lastAddedNoteRef={lastAddedNoteRef}
        />
      </>
    );
  },
);

Home.displayName = "Home";

export default Home;
