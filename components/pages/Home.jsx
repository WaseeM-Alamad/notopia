"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Note from "../others/Note";
import { motion } from "framer-motion";
import { updateOrderAction } from "@/utils/actions";
import ComposeNote from "../others/ComposeNote";
import { useAppContext } from "@/context/AppContext";

const GUTTER = 15;
const GAP_BETWEEN_SECTIONS = 88;

const NoteWrapper = memo(
  ({
    isGrid,
    dispatchNotes,
    selectedNotesRef,
    openSnackFunction,
    note,
    overIndexRef,
    overIsPinnedRef,
    noteActions,
    fadingNotes,
    setFadingNotes,
    lastAddedNoteRef,
    calculateLayout,
    isLoadingImages,
    setSelectedNotesIDs,
    handleDragStart,
    index,
    handleSelectNote,
    setTooltipAnchor,
    handleNoteClick,
  }) => {
    const [mounted, setMounted] = useState(false);
    const noteRef = useRef(null);

    const setRefs = (element) => {
      noteRef.current = element;
      if (lastAddedNoteRef) lastAddedNoteRef.current = element;
    };

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
            handleDragStart(e, targetElement, index, note.isPinned);
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
      overIndexRef.current = index;
      overIsPinnedRef.current = note.isPinned;
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, type: "tween" }}
      >
        <div
          ref={setRefs}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onClick={(e) => handleNoteClick(e, note, index)}
          className={`grid-item ${
            fadingNotes.has(note.uuid) ? "fade-out" : ""
          }`}
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
            dispatchNotes={dispatchNotes}
            selectedNotesRef={selectedNotesRef}
            note={note}
            noteActions={noteActions}
            setTooltipAnchor={setTooltipAnchor}
            calculateLayout={calculateLayout}
            setFadingNotes={setFadingNotes}
            isLoadingImagesAddNote={isLoadingImages}
            setSelectedNotesIDs={setSelectedNotesIDs}
            handleSelectNote={handleSelectNote}
            openSnackFunction={openSnackFunction}
            index={index}
          />
          {/* <p>{index}</p> */}
        </div>
      </motion.div>
    );
  }
);

NoteWrapper.displayName = "NoteWrapper";

const Home = memo(
  ({
    layoutVersionRef,
    visibleItems,
    selectedNotesRef,
    setVisibleItems,
    notes,
    notesStateRef,
    order,
    fadingNotes,
    setFadingNotes,
    dispatchNotes,
    setTooltipAnchor,
    openSnackFunction,
    handleNoteClick,
    setSelectedNotesIDs,
    handleSelectNote,
    noteActions,
    notesReady,
    containerRef,
    rootContainerRef,
    isGrid,
  }) => {
    const { layout } = useAppContext();
    const [pinnedHeight, setPinnedHeight] = useState(null);
    const [isLoadingImages, setIsLoadingImages] = useState([]);
    const lastAddedNoteRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);
    const [layoutReady, setLayoutReady] = useState(false);
    const [columnsNumber, setColumnsNumber] = useState(null);
    const COLUMN_WIDTH = layout === "grid" ? 240 : 600;

    const hasPinned = [...visibleItems].some((uuid) => {
      const note = notes.get(uuid);
      return note?.isPinned;
    });

    const hasUnpinned = [...visibleItems].some((uuid) => {
      const note = notes.get(uuid);
      return !note?.isPinned;
    });

    const notesExist = order.some((uuid) => {
      const note = notes.get(uuid);
      if (note?.isArchived || note?.isTrash) return false;
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

        // const columns = 1;

        // const contentWidth = COLUMN_WIDTH;
        setColumnsNumber(columns);

        container.style.width = `${contentWidth}px`;
        container.style.maxWidth = isGrid ? "100%" : "90%";
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

        // Gap between pinned and unpinned sections
        const gapBetweenSections =
          pinnedItems.length > 0 ? GAP_BETWEEN_SECTIONS : 0;
        const pinnedHeight = positionItems(
          pinnedItems,
          pinnedItems.length > 0 && 30
        );
        const unpinnedHeight = positionItems(
          unpinnedItems,
          pinnedHeight + gapBetweenSections
        );

        setPinnedHeight(pinnedHeight);
        container.style.height = `${unpinnedHeight}px`;
        requestAnimationFrame(() => {
          setLayoutReady(true);
        });
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
    }, [calculateLayout, debouncedCalculateLayout, notes, order]);

    useEffect(() => {
      if (notes.length > 0) {
        const timer = setTimeout(calculateLayout, 50);
        return () => clearTimeout(timer);
      }
    }, [notes, calculateLayout]);

    const draggedNoteRef = useRef(null);
    const draggedIndexRef = useRef(null);
    const draggedIsPinnedRef = useRef(null);
    const overIndexRef = useRef(null);
    const overIsPinnedRef = useRef(null);
    const endIndexRef = useRef(null);
    const isDragging = useRef(false);
    const lastSwapRef = useRef(0);
    const ghostElementRef = useRef(null);

    useEffect(() => {
      const handler = () => {
        if (ghostElementRef.current) {
          document.body.removeChild(ghostElementRef.current);
        }
        if (document.body.classList.contains("dragging")) {
          document.body.classList.remove("dragging");
        }
      };

      window.addEventListener("hashchange", handler);

      return () => window.removeEventListener("hashchange", handler);
    }, []);

    const handleDragStart = useCallback(
      (e, targetElement, index, isPinned) => {
        // e.preventDefault();
        if (draggedNoteRef.current) {
          return;
        }
        isDragging.current = true;
        draggedNoteRef.current = targetElement;
        if (!document.body.classList.contains("dragging")) {
          document.body.classList.add("dragging");
        }
        const draggedElement = targetElement;
        const draggedInitialIndex = index;
        draggedIndexRef.current = index;
        draggedIsPinnedRef.current = isPinned;
        document.querySelector(".starting-div")?.classList.add("dragging");

        const rect = draggedElement.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        ghostElementRef.current = draggedElement.cloneNode(true);
        draggedElement.classList.add("dragged-element");
        const ghostElement = ghostElementRef.current;
        document.body.appendChild(ghostElement);
        const pin = ghostElement.querySelector(".pin");
        pin.style.opacity = "1";
        pin.style.transition = "0.3s";

        ghostElement.classList.add("ghost-note");

        ghostElement.style.left = `${rect.left - 15}px`;
        ghostElement.style.top = `${rect.top - 15}px`;

        const updateGhostPosition = (moveEvent) => {
          if (layout === "grid") {
            ghostElement.style.left = `${moveEvent.clientX - offsetX - 15}px`; // Update left with offset
          }
          ghostElement.style.top = `${moveEvent.clientY - offsetY - 15}px`; // Update top with offset
        };

        document.addEventListener("mousemove", updateGhostPosition);

        const handleDragEnd = () => {
          if (ghostElement && document.body.contains(ghostElement)) {
            setTimeout(() => {
              if (
                endIndexRef.current !== null &&
                endIndexRef.current !== draggedInitialIndex
              ) {
                window.dispatchEvent(new Event("loadingStart"));
                updateOrderAction({
                  initialIndex: draggedInitialIndex,
                  endIndex: endIndexRef.current,
                })
                  .then(() => window.dispatchEvent(new Event("loadingEnd")))
                  .catch((err) => {
                    console.log(err);
                  });
              }

              document
                .querySelector(".starting-div")
                ?.classList.remove("dragging");
              const rect = draggedElement.getBoundingClientRect();
              ghostElement.classList.remove("ghost-note");
              ghostElement.classList.add("restore-ghost-note");
              ghostElement.style.top = `${rect.top}px`;
              ghostElement.style.left = `${rect.left}px`;
              pin.style.opacity = "0";
              isDragging.current = false;

              setTimeout(() => {
                if (document.body.contains(ghostElement)) {
                  document.body.removeChild(ghostElement);
                }
                draggedElement.classList.remove("dragged-element");
                if (document.body.classList.contains("dragging")) {
                  document.body.classList.remove("dragging");
                }
                draggedNoteRef.current = null;
                draggedIndexRef.current = null;
                draggedIsPinnedRef.current = null;
                overIndexRef.current = null;
                overIsPinnedRef.current = null;
                endIndexRef.current = null;
                ghostElementRef.current = null;
              }, 250);
            }, 50);
          }
          document.removeEventListener("mousemove", updateGhostPosition);
          document.removeEventListener("mouseup", handleDragEnd);

          calculateLayout();
        };

        document.addEventListener("mouseup", handleDragEnd);
      },
      [calculateLayout, layout]
    );

    const handleDragOver = async () => {
      if (!isDragging.current) return;
      if (draggedIsPinnedRef.current !== overIsPinnedRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastSwapRef.current < 150) return;

      lastSwapRef.current = now;

      if (draggedIndexRef.current === null || overIndexRef.current === null)
        return null;
      endIndexRef.current = overIndexRef.current;

      // Copy notes to avoid mutating state directly
      const updatedOrder = [...order];
      const [draggedNote] = updatedOrder.splice(draggedIndexRef.current, 1);
      updatedOrder.splice(overIndexRef.current, 0, draggedNote);

      dispatchNotes({
        type: "DND",
        updatedOrder,
      });

      overIndexRef.current = draggedIndexRef.current;
      draggedIndexRef.current = endIndexRef.current;
    };

    const handleMouseMove = (e) => {
      //attached to container of notes
      if (!isDragging.current) return;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const overNoteElement = document
        .elementFromPoint(mouseX, mouseY)
        .closest(".grid-item");

      if (!overNoteElement) return;

      handleDragOver();
    };

    useEffect(() => {
      console.log("calculate")
      calculateLayout();
    }, [visibleItems]);

    return (
      <>
        <div ref={rootContainerRef} className="starting-div">
          <div
            ref={containerRef}
            className="section-container"
            style={{ opacity: !layoutReady && "0" }}
            onMouseMove={handleMouseMove}
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
              if (!visibleItems.has(note.uuid)) return null;

              return (
                !note.isArchived &&
                !note.isTrash && (
                  <NoteWrapper
                    lastAddedNoteRef={index === 0 ? lastAddedNoteRef : null}
                    selectedNotesRef={selectedNotesRef}
                    key={note.uuid}
                    note={note}
                    isGrid={isGrid}
                    overIndexRef={overIndexRef}
                    overIsPinnedRef={overIsPinnedRef}
                    fadingNotes={fadingNotes}
                    setFadingNotes={setFadingNotes}
                    index={index}
                    noteActions={noteActions}
                    dispatchNotes={dispatchNotes}
                    setTooltipAnchor={setTooltipAnchor}
                    handleDragStart={handleDragStart}
                    openSnackFunction={openSnackFunction}
                    setSelectedNotesIDs={setSelectedNotesIDs}
                    handleNoteClick={handleNoteClick}
                    handleSelectNote={handleSelectNote}
                    {...(isLoadingImages.includes(note.uuid)
                      ? { isLoadingImages }
                      : {})}
                    calculateLayout={calculateLayout}
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
          setTooltipAnchor={setTooltipAnchor}
          openSnackFunction={openSnackFunction}
        />
      </>
    );
  }
);

Home.displayName = "Home";

export default Home;
