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
import { motion } from "framer-motion";

const COLUMN_WIDTH = 240;
const GUTTER = 15;

const NoteWrapper = memo(({ note, setNotes, isVisible, ref }) => {
  const { modalOpen } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [mountOpacity, setMountOpacity] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 100);
  }, []);

  useEffect(() => {
    if (!modalOpen) setMountOpacity(true);
  }, [modalOpen]);

  return (
    <motion.div
      ref={ref}
      className="grid-item"
      style={{
        width: `${COLUMN_WIDTH}px`,
        marginBottom: `${GUTTER}px`,
        transition: `transform ${mounted ? "0.2s" : "0"} ease, opacity 0s`,
        opacity: isVisible ? (mountOpacity ? 1 : 0) : 0,
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      <Note note={note} setNotes={setNotes} />
    </motion.div>
  );
});

NoteWrapper.displayName = "NoteWrapper";

const Home = memo(({ notes, setNotes }) => {
  const [isLayoutReady, setIsLayoutReady] = useState(false);
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
      container.style.position = "relative";
      container.style.left = "50%";
      container.style.transform = "translateX(-50%)";

      const items = container.children;

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
  }, [calculateLayout, debouncedCalculateLayout, notes]);

  useEffect(() => {
    if (notes.length > 0) {
      const timer = setTimeout(calculateLayout, 50);
      return () => clearTimeout(timer);
    }
  }, [notes, calculateLayout]);

  return (
    <>
      <div className="starting-div">
        <div
          ref={containerRef}
          className="notes-container"
          style={{
            visibility: isLayoutReady ? "visible" : "hidden",
          }}
        >
          {notes.map((note, index) => {
            if (note.isArchived)
              return (
                <NoteWrapper
                  key={note.uuid}
                  note={note}
                  setNotes={setNotes}
                  isVisible={isLayoutReady}
                />
              );
          })}
        </div>
      </div>
      <AddNoteModal
        trigger={false}
        setTrigger={() => {}}
        setNotes={setNotes}
        lastAddedNoteRef={null}
      />
    </>
  );
});

Home.displayName = "Home";

export default Home;
