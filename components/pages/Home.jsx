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

const COLUMN_WIDTH = 240;
const GUTTER = 15;
const GAP_BETWEEN_SECTIONS = 120;

const NoteWrapper = memo(
  ({
    note,
    setNotes,
    togglePin,
    isVisible,
    ref,
    calculateLayout,
    isLoadingImages,
    setSelectedNotesIDs,
    selectedNotes,
  }) => {
    // const { modalOpen, setModalOpen } = useAppContext();
    const [mounted, setMounted] = useState(false);
    const [mountOpacity, setMountOpacity] = useState(false);
    useEffect(() => {
      setTimeout(() => {
        setMounted(true);
      }, 100);
    }, []);

    // useEffect(() => {
    // if (!modalOpen) setMountOpacity(true);
    // }, [modalOpen]);

    useEffect(() => {
      const handler = () => {
        setMountOpacity(true);
      };

      window.addEventListener("closeModal", handler);
      return () => {
        window.removeEventListener("closeModal", handler);
      };
    }, []);

    return (
      <motion.div
        ref={ref}
        data-pinned={note.isPinned}
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
            note={note}
            setNotes={setNotes}
            togglePin={togglePin}
            calculateLayout={calculateLayout}
            isLoadingImagesAddNote={isLoadingImages}
            setSelectedNotesIDs={setSelectedNotesIDs}
            selectedNotes={selectedNotes}
          />
        </motion.div>
      </motion.div>
    );
  }
);

NoteWrapper.displayName = "NoteWrapper";

const Home = memo(({ notes, setNotes }) => {
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

      const items = container.children;
      const pinnedItems = Array.from(items).filter(
        (item) => item.dataset.pinned === "true"
      );
      const unpinnedItems = Array.from(items).filter(
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
        // Small delay to ensure smooth transition
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
  }, [calculateLayout, debouncedCalculateLayout, notes]);

  const togglePin = useCallback((uuid) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.uuid === uuid ? { ...note, isPinned: !note.isPinned } : note
      )
    );
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
      console.log("dispatch")
      window.dispatchEvent(new Event("closeModal"));
      hasDispatched.current = true;
    }
    if (isFirstRender.current){
      isFirstRender.current = false;
    }
  }, [notes]); // Runs after notes are rendered

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
          style={{
            visibility: isLayoutReady ? "visible" : "hidden",
          }}
        >
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
          {notes.map(
            (note, index) =>
              !note.isArchived && (
                <NoteWrapper
                  ref={index === 0 ? lastAddedNoteRef : null}
                  key={note.uuid}
                  note={note}
                  setNotes={setNotes}
                  togglePin={togglePin}
                  isVisible={isLayoutReady}
                  setSelectedNotesIDs={setSelectedNotesIDs}
                  {...(isLoadingImages.includes(note.uuid)
                    ? { isLoadingImages }
                    : {})}
                  calculateLayout={calculateLayout}
                  selectedNotes={selectedRef}
                />
              )
          )}
        </div>
      </div>
      <AddNoteModal
        setNotes={setNotes}
        lastAddedNoteRef={lastAddedNoteRef}
        setIsLoadingImages={setIsLoadingImages}
      />
    </>
  );
});

Home.displayName = "Home";

export default Home;
