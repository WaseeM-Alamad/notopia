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
import Note from "./Note";
import NotesIcon from "./icons/NotesIcon";
import SortByIcon from "./icons/SortByIcon";
import LabelIcon from "./icons/LabelIcon";
import AddNoteModal from "./AddNoteModal";
import { useAppContext } from "@/context/AppContext";
import { fetchNotes } from "@/utils/actions";
import { motion } from "framer-motion";

const COLUMN_WIDTH = 260;
const GUTTER = 15;
const GAP_BETWEEN_SECTIONS = 120;

const Header = memo(() => (
  <div className="page-header">
    <NotesIcon />
    <h1 className="page-header-title">All Notes</h1>
    <div className="page-header-divider" />
    <div className="divider-tools-container">
      <div className="divider-tool">
        <SortByIcon />
        <span className="divider-tool-text">Sort by</span>
      </div>
      <div className="divider-tool">
        <LabelIcon />
        <span className="divider-tool-text">Labels</span>
      </div>
    </div>
  </div>
));

Header.displayName = "Header";

const NoteWrapper = memo(({ note, togglePin, isVisible, ref }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 100);
  }, []);
  return (
    <motion.div
      ref={ref}
      data-pinned={note.isPinned}
      className="grid-item"
      style={{
        width: `${COLUMN_WIDTH}px`,
        marginBottom: `${GUTTER}px`,
        transition: `transform ${mounted ? "0.2s" : "0"} ease`,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      <Note Note={note} togglePin={togglePin} />
    </motion.div>
  );
});

NoteWrapper.displayName = "NoteWrapper";

const Home = memo(() => {
  const [notes, setNotes] = useState([]);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [othersHeight, setOthersHeight] = useState(null);
  const { modalOpen, setModalOpen } = useAppContext();
  const lastAddedNoteRef = useRef(null);
  const containerRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const layoutFrameRef = useRef(null);

  const getNotes = async () => {
    window.dispatchEvent(new Event("loadingStart"));
    const fetchedNotes = await fetchNotes();
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);

    setNotes(fetchedNotes.data);
  };

  useEffect(() => {
    getNotes();
    window.addEventListener("refresh", getNotes);

    return () => window.removeEventListener("refresh", getNotes);
  }, []);

  const { pinnedNotes, unpinnedNotes } = useMemo(
    () => ({
      pinnedNotes: notes.filter((note) => note.isPinned),
      unpinnedNotes: notes.filter((note) => !note.isPinned),
    }),
    [notes]
  );

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

  // const togglePin = useCallback((uuid) => {
  //   setNotes((prevNotes) => {
  //     // Find the note to toggle
  //     const toggledNote = prevNotes.find((note) => note.uuid === uuid);

  //     // Remove the toggled note from the list
  //     const remainingNotes = prevNotes.filter((note) => note.uuid !== uuid);

  //     if (toggledNote.isPinned) {
  //       // If the note was pinned, unpin it and add it to the start of unpinned notes
  //       return [{ ...toggledNote, isPinned: false }, ...remainingNotes];
  //     } else {
  //       // If the note was unpinned, pin it and add it to the start of pinned notes
  //       return [{ ...toggledNote, isPinned: true }, ...remainingNotes];
  //     }
  //   });
  // }, []);

  useEffect(() => {
    if (notes.length > 0) {
      const timer = setTimeout(calculateLayout, 50);
      return () => clearTimeout(timer);
    }
  }, [notes, calculateLayout]);

  return (
    <>
      <div className="starting-div">
        <Header />
        <div
          ref={containerRef}
          className="notes-container"
          style={{
            visibility: isLayoutReady ? "visible" : "hidden",
          }}
        >
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
          {notes.map((note, index) => (
            <NoteWrapper
              ref={index === 0 ? lastAddedNoteRef : null}
              key={note.uuid}
              note={note}
              togglePin={togglePin}
              isVisible={isLayoutReady}
            />
          ))}
        </div>
      </div>
      <AddNoteModal
        trigger={modalOpen}
        setTrigger={setModalOpen}
        setNotes={setNotes}
        lastAddedNoteRef={lastAddedNoteRef}
      />
    </>
  );
});

Home.displayName = "Home";

export default Home;
