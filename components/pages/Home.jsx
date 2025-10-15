"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Note from "../others/Note";
import { motion } from "framer-motion";
import { updateOrderAction } from "@/utils/actions";
import ComposeNote from "../others/ComposeNote";
import { useAppContext } from "@/context/AppContext";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";

const GUTTER = 15;
const GAP_BETWEEN_SECTIONS = 88;

const NoteWrapper = memo(
  ({
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
  }) => {
    const [mounted, setMounted] = useState(false);
    const noteRef = useRef(null);

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
              note?.isPinned
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

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, type: "tween" }}
      >
        <div
          ref={noteRef}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onClick={(e) =>
            handleNoteClick(e, note, notesIndexMapRef.current.get(note.uuid))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleNoteClick(e, note, notesIndexMapRef.current.get(note.uuid));
            }
          }}
          className={`grid-item ${
            fadingNotes.has(note?.uuid) ? "fade-out" : ""
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
            setFadingNotes={setFadingNotes}
            setSelectedNotesIDs={setSelectedNotesIDs}
            handleSelectNote={handleSelectNote}
            handleNoteClick={handleNoteClick}
          />
          {/* <p style={{position: "absolute", bottom: "40px", color: "blue"}}>{notesIndexMapRef.current.get(note.uuid)}</p> */}
        </div>
      </motion.div>
    );
  }
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
    isGrid,
  }) => {
    const {
      user,
      clientID,
      layout,
      calculateLayoutRef,
      focusedIndex,
      openSnackRef,
      notesStateRef,
      notesIndexMapRef,
      isExpanded,
    } = useAppContext();
    const userID = user?.id;
    const [pinnedHeight, setPinnedHeight] = useState(null);
    const lastAddedNoteRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);
    const [layoutReady, setLayoutReady] = useState(false);
    const [addPadding, setAddPadding] = useState(false);
    const COLUMN_WIDTH = layout === "grid" ? 240 : 600;

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

    useEffect(() => {
      const width = window.innerWidth;
      setAddPadding(width >= 605 && isExpanded.open);
    }, [isExpanded.open]);

    useEffect(() => {
      calculateLayoutRef.current = calculateLayout;
    }, [calculateLayout, layout]);

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
        ghostElement.style.width = rect.width + "px";
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
                handleServerCall(
                  [
                    () =>
                      updateOrderAction({
                        initialIndex: draggedInitialIndex,
                        endIndex: endIndexRef.current,
                        clientID: clientID,
                      }),
                  ],
                  openSnackRef.current
                );
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
              lastEl = null;
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

    const handleDragOver = async (noteElement) => {
      if (!isDragging.current) return;
      if (draggedIsPinnedRef.current !== overIsPinnedRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastSwapRef.current < 150) return;

      noteElement && (lastEl = noteElement);

      lastSwapRef.current = now;
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "DND",
        initialIndex: draggedIndexRef.current,
        finalIndex: overIndexRef.current,
      });
      dispatchNotes({
        type: "DND",
        initialIndex: draggedIndexRef.current,
        finalIndex: overIndexRef.current,
      });
      endIndexRef.current = overIndexRef.current;
      overIndexRef.current = draggedIndexRef.current;
      draggedIndexRef.current = endIndexRef.current;
    };

    // const handleMouseMove = (e) => {
    //   if (!isDragging.current) return;
    //   const mouseX = e.clientX;
    //   const mouseY = e.clientY;
    //   const overNoteElement = document
    //     .elementFromPoint(mouseX, mouseY)
    //     .closest(".grid-item");
    //   if (!overNoteElement) return;
    //   handleDragOver();
    // };
    let lastEl = null;
    useEffect(() => {
      let animationFrame;
      let lastMouseX = 0;
      let lastMouseY = 0;

      const checkCollisions = () => {
        if (!isDragging.current) {
          animationFrame = requestAnimationFrame(checkCollisions);
          return;
        }

        for (const uuid of notesStateRef.current.order) {
          const note = notesStateRef.current.notes.get(uuid);
          const noteElement = note?.ref?.current;
          if (!noteElement) continue;
          if (noteElement.parentElement === draggedNoteRef.current) continue;

          const rect = noteElement.parentElement.getBoundingClientRect();
          const height = Math.abs(rect.top - rect.bottom);

          if (lastEl) {
            const lastElRect = lastEl.getBoundingClientRect();
            if (
              lastMouseX < lastElRect.left ||
              lastMouseX > lastElRect.right ||
              lastMouseY < lastElRect.top ||
              lastMouseY > lastElRect.bottom
            ) {
              lastEl = null;
            }
          }

          if (lastEl === noteElement) {
            if (height < 250) continue;
            const halfHeight = height * 0.5;
            if (
              lastMouseX >= rect.left &&
              lastMouseX <= rect.right &&
              lastMouseY >= rect.top + halfHeight - 20 &&
              lastMouseY <= rect.bottom - halfHeight + 20
            ) {
              handleDragOver();
              break;
            }
          } else {
            if (
              lastMouseX >= rect.left &&
              lastMouseX <= rect.right &&
              lastMouseY >= rect.top &&
              lastMouseY <= rect.bottom
            ) {
              handleDragOver(noteElement);
              break;
            }
          }
        }

        animationFrame = requestAnimationFrame(checkCollisions);
      };

      const handleMouseMove = (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      };

      document.addEventListener("mousemove", handleMouseMove);
      animationFrame = requestAnimationFrame(checkCollisions);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        cancelAnimationFrame(animationFrame);
      };
    }, []);

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

    useEffect(() => {
      getLastRef();
    }, [notes, order]);

    return (
      <>
        <div
          ref={rootContainerRef}
          className={`starting-div ${addPadding ? "sidebar-expanded" : "sidebar-collapsed"}`}
        >
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
                    handleDragStart={handleDragStart}
                    notesIndexMapRef={notesIndexMapRef}
                    setSelectedNotesIDs={setSelectedNotesIDs}
                    handleNoteClick={handleNoteClick}
                    handleSelectNote={handleSelectNote}
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
  }
);

Home.displayName = "Home";

export default Home;
