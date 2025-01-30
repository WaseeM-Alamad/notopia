"use client";
import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import "@/assets/styles/home.css";
import Note from "../others/Note";
import AddNoteModal from "../others/AddNoteModal";
import { useAppContext } from "@/context/AppContext";
import { AnimatePresence, motion } from "framer-motion";
import TopMenuHome from "../others/topMenu/TopMenuHome";
import { NoteUpdateAction, updateOrderAction } from "@/utils/actions";

const COLUMN_WIDTH = 240;
const GUTTER = 15;
const GAP_BETWEEN_SECTIONS = 120;

const NoteWrapper = memo(
  ({
    dispatchNotes,
    note,
    isVisible,
    lastAddedNoteRef,
    calculateLayout,
    isLoadingImages,
    setSelectedNotesIDs,
    selectedNotes,
    handleDragStart,
    index,
    isDragging,
  }) => {
    // const { modalOpen, setModalOpen } = useAppContext();
    const [mounted, setMounted] = useState(false);
    const [mountOpacity, setMountOpacity] = useState(false);
    const [modalTrigger, setModalTrigger] = useState(false);
    const noteRef = useRef(null);
    const timeoutRef = useRef(null);

    const setRefs = (element) => {
      noteRef.current = element;
      if (lastAddedNoteRef) lastAddedNoteRef.current = element;
    };

    useEffect(() => {
      setTimeout(() => {
        setMounted(true);
      }, 100);
    }, []);

    useEffect(() => {
      const handler = () => {
        setMountOpacity(true);
      };

      window.addEventListener("closeModal", handler);
      return () => {
        window.removeEventListener("closeModal", handler);
      };
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
            !modalTrigger &&
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
        data-uuid={note.uuid}
        onMouseDown={handleMouseDown}
        className="grid-item"
        style={{
          width: `${COLUMN_WIDTH}px`,
          marginBottom: `${GUTTER}px`,
          transition: `transform ${mounted ? "0.2s" : "0"} ease, opacity 0s`,
          pointerEvents: isVisible ? "auto" : "none",
        }}
      >
        <motion.div
          style={{
            opacity: isVisible ? (mountOpacity ? 1 : 0) : 0,
          }}
        >
          <Note
            dispatchNotes={dispatchNotes}
            note={note}
            calculateLayout={calculateLayout}
            isLoadingImagesAddNote={isLoadingImages}
            setSelectedNotesIDs={setSelectedNotesIDs}
            selectedNotes={selectedNotes}
            isDragging={isDragging}
            modalTrigger={modalTrigger}
            setModalTrigger={setModalTrigger}
            index={index}
          />
        </motion.div>
        {/* <p>{index}</p> */}
      </motion.div>
    );
  }
);

NoteWrapper.displayName = "NoteWrapper";

const Home = memo(({ notes, order, dispatchNotes }) => {
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [othersHeight, setOthersHeight] = useState(null);
  const [isLoadingImages, setIsLoadingImages] = useState([]);
  const [selectedNotesIDs, setSelectedNotesIDs] = useState([]);
  const selectedRef = useRef(false);
  const lastAddedNoteRef = useRef(null);
  const containerRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const layoutFrameRef = useRef(null);
  const hasDispatched = useRef(false);
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
      const pinnedHeight = positionItems(pinnedItems);
      const unpinnedHeight = positionItems(
        unpinnedItems,
        pinnedHeight + gapBetweenSections
      );

      setUnpinnedNotesNumber(unpinnedItems.length);
      setPinnedNotesNumber(pinnedItems.length);
      setOthersHeight(pinnedHeight);
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

  const togglePin = useCallback(async (note, index) => {
    const updatedNote = { ...note, isPinned: !note.isPinned };

    setNotes((prev) => {
      const newNotes = new Map(prev);
      newNotes.set(note.uuid, updatedNote);
      return newNotes; // Return the updated map
    });

    setOrder((prev) => {
      const filteredOrder = prev.filter((uuid) => uuid !== note.uuid); // Remove the UUID
      return [note.uuid, ...filteredOrder]; // Add it to the start
    });

    window.dispatchEvent(new Event("loadingStart"));
    await updateOrderAction({
      type: "shift to start",
      uuid: note.uuid,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  }, []);

  useEffect(() => {
    if (notes.length > 0) {
      const timer = setTimeout(calculateLayout, 50);
      return () => clearTimeout(timer);
    }
  }, [notes, calculateLayout]);

  useEffect(() => {
    selectedRef.current = selectedNotesIDs.length > 0;
  }, [selectedNotesIDs]);

  useEffect(() => {
    if (!hasDispatched.current && !isFirstRender.current) {
      window.dispatchEvent(new Event("closeModal"));
      hasDispatched.current = true;
    }
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, [notes]); // Runs after notes are rendered

  const draggedNoteRef = useRef(null);
  const ghostElementRef = useRef(null);
  const endIndexRef = useRef(null);
  const isDragging = useRef(false);
  const lastSwapRef = useRef(0);

  const handleDragStart = useCallback(
    (e, targetElement) => {
      // e.preventDefault();
      if (draggedNoteRef.current) {
        return;
      }
      isDragging.current = true;
      draggedNoteRef.current = targetElement;
      document.body.classList.add("dragging");
      const draggedElement = targetElement;
      const draggedInitialIndex = parseInt(
        draggedNoteRef.current.dataset.position,
        10
      );
      draggedElement.style.opacity = "0";
      draggedElement.style.transition = "none";
      draggedElement.style.pointerEvents = "none";
      const draggedHeight = window.getComputedStyle(draggedElement).height;
      const IntHeight = Number.parseInt(draggedHeight, 10);

      const rect = draggedElement.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const ghostElement =
        draggedElement.children[0].children[0].children[1].cloneNode(true);
      if (ghostElement.children[1]) {
        ghostElement.children[1].style.transition = "0.1s ease-in-out";
        setTimeout(() => {
          ghostElement.children[1].style.opacity = "0";
        }, 1);
      }
      ghostElement.style.position = "fixed";
      // ghostElement.style.height = `${IntHeight + 25}px`;
      ghostElement.style.zIndex = "9999";
      ghostElement.style.opacity = "0.97";
      ghostElement.style.pointerEvents = "none";
      ghostElement.style.transition = "none";
      ghostElement.style.cursor = "move";
      ghostElement.style.borderRadius = "0.8rem";
      ghostElement.style.boxShadow = "2px 1px 25px -3px rgba(112,112,112,0.8)";
      ghostElement.style.transform = `none`;
      ghostElement.style.left = `${rect.left - 15}px`; // Set initial left
      ghostElement.style.top = `${rect.top - 15}px`; // Set initial top
      document.body.appendChild(ghostElement);
      ghostElementRef.current = ghostElement;

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

            const rect = draggedElement.getBoundingClientRect();
            ghostElement.style.transition =
              " all 0.25s cubic-bezier(0.52, 0, 0.18, 1), height 0.1s ";
            ghostElement.style.boxShadow = "none";
            ghostElement.style.pointerEvents = "auto";
            // ghostElement.style.height = `${IntHeight}px`;
            ghostElement.style.top = `${rect.top}px`;
            ghostElement.style.left = `${rect.left}px`;
            ghostElement.style.opacity = "1";
            isDragging.current = false;

            setTimeout(() => {
              document.body.removeChild(ghostElement);
              draggedElement.style.opacity = "1";
              draggedElement.style.transition =
                "transform 0.2s ease, opacity 0s";
              draggedElement.style.pointerEvents = "all";
              document.body.classList.remove("dragging");
              draggedNoteRef.current = null;
              endIndexRef.current = null;
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

  const handleDragOver = async (overUUID, overIsPinned, overIndex) => {
    if (!isDragging.current) return;
    const draggedUUID = draggedNoteRef.current.dataset.uuid;
    const draggedIsPinned = draggedNoteRef.current.dataset.pinned === "true";
    if (
      !draggedUUID ||
      draggedUUID === overUUID ||
      draggedIsPinned !== overIsPinned
    ) {
      return;
    }

    console.log("hi");
    const now = Date.now();
    if (now - lastSwapRef.current < 150) return;

    lastSwapRef.current = now;
    const draggedIndex = parseInt(draggedNoteRef.current.dataset.position, 10);

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

    if (!overNoteElement || !overNoteElement.dataset.uuid) return;
    // console.log("overNote", overNoteElement);

    const overNoteIsPinned = overNoteElement.dataset.pinned === "true";
    const overNoteUUID = overNoteElement.dataset.uuid;
    const overIndex = parseInt(overNoteElement.dataset.position, 10);

    // console.log("isPinned", overNoteIsPinned, "index", overIndex)
    // console.log("uuid", overNoteUUID)

    handleDragOver(overNoteUUID, overNoteIsPinned, overIndex);
  };

  return (
    <>
      <TopMenuHome
        selectedNotesIDs={selectedNotesIDs}
        setSelectedNotesIDs={setSelectedNotesIDs}
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
              top: "33px",
              opacity: pinnedNotesNumber > 0 ? "1" : "0",
            }}
          >
            PINNED
          </p>
          <p
            className="section-label"
            style={{
              top: `${othersHeight + 150}px`,
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
                  dispatchNotes={dispatchNotes}
                  isDragging={isDragging}
                  handleDragStart={handleDragStart}
                  isVisible={isLayoutReady}
                  setSelectedNotesIDs={setSelectedNotesIDs}
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
      />
    </>
  );
});

Home.displayName = "Home";

export default Home;
