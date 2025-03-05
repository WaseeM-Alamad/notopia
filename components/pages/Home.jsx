"use client";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "@/assets/styles/home.css";
import Note from "../others/Note";
import AddNoteModal from "../others/AddNoteModal";
import { useAppContext } from "@/context/AppContext";
import { AnimatePresence, motion } from "framer-motion";
import TopMenuHome from "../others/topMenu/TopMenuHome";
import {
  NoteUpdateAction,
  undoAction,
  updateOrderAction,
} from "@/utils/actions";

const COLUMN_WIDTH = 240;
const GUTTER = 15;
const GAP_BETWEEN_SECTIONS = 88;

const NoteWrapper = memo(
  ({
    dispatchNotes,
    openSnackFunction,
    note,
    isVisible,
    noteActions,
    lastAddedNoteRef,
    calculateLayout,
    isLoadingImages,
    setSelectedNotesIDs,
    selectedNotes,
    handleDragStart,
    index,
    isDragging,
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
      setTimeout(() => {
        setMounted(true);
      }, 100);
    }, []);

    let startX, startY;

    const handleMouseDown = (e) => {
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
            handleDragStart(e, targetElement);
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

    return (
      <motion.div
        ref={setRefs}
        data-pinned={note.isPinned}
        data-position={index}
        onMouseDown={handleMouseDown}
        onClick={(e) => handleNoteClick(e, note, index)}
        className="grid-item"
        style={{
          width: `${COLUMN_WIDTH}px`,
          marginBottom: `${GUTTER}px`,
          transition: `transform ${
            mounted ? "0.22s" : "0"
          } cubic-bezier(0.5, 0.2, 0.3, 1), opacity 0s`,
        }}
      >
        {/* <button onClick={()=> console.log(note)}>note</button> */}

        <Note
          dispatchNotes={dispatchNotes}
          note={note}
          noteActions={noteActions}
          setTooltipAnchor={setTooltipAnchor}
          calculateLayout={calculateLayout}
          isLoadingImagesAddNote={isLoadingImages}
          setSelectedNotesIDs={setSelectedNotesIDs}
          selectedNotes={selectedNotes}
          isDragging={isDragging}
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
    handleNoteClick,
    noteActions,
  }) => {
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const [pinnedHeight, setPinnedHeight] = useState(null);
    const [isLoadingImages, setIsLoadingImages] = useState([]);
    const [selectedNotesIDs, setSelectedNotesIDs] = useState([]);
    const selectedRef = useRef(false);
    const lastAddedNoteRef = useRef(null);
    const containerRef = useRef(null);
    const resizeTimeoutRef = useRef(null);
    const layoutFrameRef = useRef(null);
    const isFirstRender = useRef(true);

    const [unpinnedNotesNumber, setUnpinnedNotesNumber] = useState(null);
    const [pinnedNotesNumber, setPinnedNotesNumber] = useState(null);

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

        // Get all the items in the container
        const items = Array.from(container.children);

        // Sort items based on their position value (ascending order)
        const sortedItems = items.sort((a, b) => {
          const aPosition = parseInt(a.dataset.position, 10); // Assuming position is stored in dataset
          const bPosition = parseInt(b.dataset.position, 10);
          return aPosition - bPosition; // Ascending order
        });

        // Filter out pinned and unpinned items
        const pinnedItems = sortedItems.filter(
          (item) => item.dataset.pinned === "true"
        );
        const unpinnedItems = sortedItems.filter(
          (item) => item.dataset.pinned === "false"
        );

        const positionItems = (itemList, startY = 0) => {
          const columnHeights = new Array(columns).fill(startY);

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

        setUnpinnedNotesNumber(unpinnedItems.length);
        setPinnedNotesNumber(pinnedItems.length);
        setPinnedHeight(pinnedHeight);
        container.style.height = `${unpinnedHeight}px`;

        // Set layout ready after initial calculation
        if (!isLayoutReady) {
          setTimeout(() => setIsLayoutReady(true), 300);
        }
      });
    }, [isLayoutReady]);

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

    useEffect(() => {
      selectedRef.current = selectedNotesIDs.length > 0;
    }, [selectedNotesIDs]);

    const draggedNoteRef = useRef(null);
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
      (e, targetElement) => {
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
        const draggedInitialIndex = parseInt(
          draggedNoteRef.current.dataset.position,
          10
        );
        draggedElement.classList.add("dragged-note");
        document.querySelector(".notes-container")?.classList.add("dragging");

        const rect = draggedElement.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        ghostElementRef.current = draggedElement
          .querySelector(".note")
          .cloneNode(true);
        const ghostElement = ghostElementRef.current;
        document.body.appendChild(ghostElement);
        const pin = ghostElement.querySelector(".pin");
        pin.style.opacity = "1";
        pin.style.transition = "0.3s";

        ghostElement.classList.add("ghost-note");

        ghostElement.style.left = `${rect.left - 15}px`;
        ghostElement.style.top = `${rect.top - 15}px`;

        const updateGhostPosition = (moveEvent) => {
          ghostElement.style.left = `${moveEvent.clientX - offsetX - 15}px`; // Update left with offset
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
                .querySelector(".notes-container")
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
                draggedElement.classList.remove("dragged-note");
                if (document.body.classList.contains("dragging")) {
                  document.body.classList.remove("dragging");
                }
                draggedNoteRef.current = null;
                endIndexRef.current = null;
                ghostElementRef.current = null;
              }, 250);
            }, 30);
          }
          document.removeEventListener("mousemove", updateGhostPosition);
          document.removeEventListener("mouseup", handleDragEnd);

          calculateLayout();
        };

        document.addEventListener("mouseup", handleDragEnd);
      },
      [calculateLayout]
    );

    const handleDragOver = async (overIsPinned, overIndex) => {
      if (!isDragging.current) return;
      const draggedIsPinned = draggedNoteRef.current.dataset.pinned === "true";
      if (draggedIsPinned !== overIsPinned) {
        return;
      }

      const now = Date.now();
      if (now - lastSwapRef.current < 150) return;

      lastSwapRef.current = now;
      const draggedIndex = parseInt(
        draggedNoteRef.current.dataset.position,
        10
      );

      if (draggedIndex === -1 || overIndex === -1) return prevOrder;
      endIndexRef.current = overIndex;

      // Copy notes to avoid mutating state directly
      const updatedOrder = [...order];
      const [draggedNote] = updatedOrder.splice(draggedIndex, 1);
      updatedOrder.splice(overIndex, 0, draggedNote);

      dispatchNotes({
        type: "DND",
        updatedOrder,
      });
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const overNoteElement = document
        .elementFromPoint(mouseX, mouseY)
        .closest(".grid-item");

      if (!overNoteElement) return;

      const overNoteIsPinned = overNoteElement.dataset.pinned === "true";
      const overIndex = parseInt(overNoteElement.dataset.position, 10);

      handleDragOver(overNoteIsPinned, overIndex);
    };

    return (
      <>
        <TopMenuHome
          selectedNotesIDs={selectedNotesIDs}
          setSelectedNotesIDs={setSelectedNotesIDs}
          setTooltipAnchor={setTooltipAnchor}
        />
        <div className="starting-div">
          <div
            ref={containerRef}
            className="notes-container"
            onMouseMove={handleMouseMove}
            style={{
              visibility: isLayoutReady ? "visible" : "hidden",
            }}
          >
            {/* <button 
            onClick={() => console.log("order", order)}
          >
            gg
          </button>  */}
            {pinnedNotesNumber === 0 &&
              unpinnedNotesNumber === 0 &&
              isLayoutReady && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                    style={{
                      margin: "auto",
                      marginTop: "auto",
                      paddingRight: "4.5rem",
                      fontSize: "1.8rem",
                      color: "#cecece",
                    }}
                  >
                    Notes you add appear here
                  </motion.div>
                </AnimatePresence>
              )}
            <p
              className="section-label"
              style={{
                // top: "33px",
                opacity: pinnedNotesNumber > 0 ? "1" : "0",
              }}
            >
              PINNED
            </p>
            <p
              className="section-label"
              style={{
                top: `${pinnedHeight + GAP_BETWEEN_SECTIONS + 2}px`,
                opacity:
                  pinnedNotesNumber > 0 && unpinnedNotesNumber > 0 ? "1" : "0",
              }}
            >
              OTHERS
            </p>
            {order.map((uuid, index) => {
              const note = notes.get(uuid);
              return (
                !note.isArchived &&
                !note.isTrash && (
                  <NoteWrapper
                    lastAddedNoteRef={index === 0 ? lastAddedNoteRef : null}
                    key={note.uuid}
                    note={note}
                    index={index}
                    noteActions={noteActions}
                    dispatchNotes={dispatchNotes}
                    isDragging={isDragging}
                    setTooltipAnchor={setTooltipAnchor}
                    handleDragStart={handleDragStart}
                    isVisible={isLayoutReady}
                    openSnackFunction={openSnackFunction}
                    setSelectedNotesIDs={setSelectedNotesIDs}
                    handleNoteClick={handleNoteClick}
                    {...(isLoadingImages.includes(note.uuid)
                      ? { isLoadingImages }
                      : {})}
                    calculateLayout={calculateLayout}
                    selectedNotes={selectedRef}
                  />
                )
              );
            })}
          </div>
        </div>
        <AddNoteModal
          dispatchNotes={dispatchNotes}
          lastAddedNoteRef={lastAddedNoteRef}
          setIsLoadingImages={setIsLoadingImages}
          setTooltipAnchor={setTooltipAnchor}
          openSnackFunction={openSnackFunction}
        />
      </>
    );
  }
);

Home.displayName = "Home";

export default Home;
