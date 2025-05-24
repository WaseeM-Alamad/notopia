import { useAppContext } from "@/context/AppContext";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Note from "../others/Note";
import { motion } from "framer-motion";

const COLUMN_WIDTH = 240;
const GUTTER = 15;
const GAP_BETWEEN_SECTIONS = 88;

const NoteWrapper = memo(
  ({
    dispatchNotes,
    openSnackFunction,
    note,
    noteActions,
    fadingNotes,
    setFadingNotes,
    calculateLayout,
    setSelectedNotesIDs,
    index,
    handleSelectNote,
    setTooltipAnchor,
    handleNoteClick,
  }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setTimeout(() => {
        setMounted(true);
      }, 100);
    }, []);

    return (
      <motion.div
        onClick={(e) => handleNoteClick(e, note, index)}
        className={`grid-item ${fadingNotes.has(note.uuid) ? "fade-out" : ""}`}
        style={{
          width: `${COLUMN_WIDTH}px`,
          marginBottom: `${GUTTER}px`,
          transition: `transform ${
            mounted ? "0.22s" : "0"
          } cubic-bezier(0.5, 0.2, 0.3, 1), opacity 0s`,
        }}
      >
        <Note
          dispatchNotes={dispatchNotes}
          note={note}
          noteActions={noteActions}
          setTooltipAnchor={setTooltipAnchor}
          calculateLayout={calculateLayout}
          setFadingNotes={setFadingNotes}
          setSelectedNotesIDs={setSelectedNotesIDs}
          handleSelectNote={handleSelectNote}
          openSnackFunction={openSnackFunction}
          index={index}
        />
      </motion.div>
    );
  }
);

const DynamicLabel = ({
  dispatchNotes,
  notes,
  notesStateRef,
  noteActions,
  notesReady,
  order,
  fadingNotes,
  setFadingNotes,
  rootContainerRef,
  setTooltipAnchor,
  openSnackFunction,
  setSelectedNotesIDs,
  handleNoteClick,
  handleSelectNote,
}) => {
  const { labelsRef, labelsReady } = useAppContext();
  const [labelObj, setLabelObj] = useState(null);
  const [hasUnpinnedNotes, setHasUnpinnedNotes] = useState(false);
  const [hasPinnedNotes, setHasPinnedNotes] = useState(false);
  const [hasArchivedNotes, setHasArchivedNotes] = useState(false);
  const [pinnedHeight, setPinnedHeight] = useState(null);
  const [sectionsHeight, setSectionsHeight] = useState(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const containerRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const layoutFrameRef = useRef(null);

  const notesExist = !order.some((uuid) => {
    const note = notes.get(uuid);
    if (!note.labels.includes(labelObj?.uuid) || note.isTrash) return false;
    return true;
  });

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace("#label/", "");
      const decodedHash = decodeURIComponent(hash);
      let targetedLabel = null;
      labelsRef.current.forEach((labelData) => {
        if (labelData.label.toLowerCase() === decodedHash.toLowerCase()) {
          targetedLabel = labelData;
        }
      });

      if (targetedLabel) {
        setLabelObj(targetedLabel);
      }
    };

    handler();

    window.addEventListener("hashchange", handler);

    return () => window.removeEventListener("hashchange", handler);
  }, [labelsReady]);

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
        if (
          !item.labels.includes(labelObj?.uuid) ||
          item.isTrash ||
          item.isArchived
        )
          return false;
        return item.isPinned === true;
      });
      const unpinnedItems = sortedItems.filter((item) => {
        if (
          !item.labels.includes(labelObj?.uuid) ||
          item.isTrash ||
          item.isArchived
        )
          return false;
        return item.isPinned === false;
      });

      const archivedItems = sortedItems.filter((item) => {
        if (!item.labels.includes(labelObj?.uuid) || item.isTrash) return false;
        return item.isArchived === true;
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
      const pinnedHeight = positionItems(
        pinnedItems,
        pinnedItems.length > 0 && 30
      );

      const unpinnedGap = pinnedItems.length > 0 ? GAP_BETWEEN_SECTIONS : 0;
      const unpinnedHeight = positionItems(
        unpinnedItems,
        pinnedHeight + unpinnedGap
      );

      const archivedGap =
        unpinnedItems.length > 0 || pinnedItems.length > 0
          ? pinnedItems.length > 0 && unpinnedItems.length === 0
            ? 0
            : GAP_BETWEEN_SECTIONS
          : 0;

      const archivedY = unpinnedHeight + archivedGap || 30;
      const archivedHeight = positionItems(archivedItems, archivedY);

      const sectionGap =
        (pinnedItems.length > 0 && unpinnedItems.length === 0
          ? unpinnedHeight - GAP_BETWEEN_SECTIONS
          : unpinnedHeight) +
        (pinnedItems.length > 0 || unpinnedItems.length > 0
          ? GAP_BETWEEN_SECTIONS + 2
          : 32);

      setHasUnpinnedNotes(!!unpinnedItems.length);

      setHasPinnedNotes(!!pinnedItems.length);

      setHasArchivedNotes(!!archivedItems.length);

      setSectionsHeight(sectionGap);

      setPinnedHeight(pinnedHeight + GAP_BETWEEN_SECTIONS + 2);
      container.style.height = `${archivedHeight}px`;
      setLayoutReady(true);
    });
  }, [labelObj]);

  const debouncedCalculateLayout = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      calculateLayout();
    }, 100);
  }, [calculateLayout, labelObj]);

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
  }, [calculateLayout, debouncedCalculateLayout, notes, order, labelObj]);

  useEffect(() => {
    if (notes.length > 0) {
      const timer = setTimeout(calculateLayout, 50);
      return () => clearTimeout(timer);
    }
  }, [notes, calculateLayout, labelObj]);

  return (
    <>
      <div ref={rootContainerRef} className="starting-div">
        <div
          ref={containerRef}
          className="section-container"
          style={{ opacity: !layoutReady && "0" }}
        >
          <p
            className="section-label"
            style={{
              // top: "33px",
              opacity: hasPinnedNotes ? "1" : "0",
            }}
          >
            PINNED
          </p>
          <p
            className="section-label"
            style={{
              top: `${pinnedHeight}px`,
              opacity: hasPinnedNotes && hasUnpinnedNotes ? "1" : "0",
            }}
          >
            OTHERS
          </p>
          <p
            className="section-label"
            style={{
              top: `${sectionsHeight}px`,
              opacity: hasArchivedNotes ? "1" : "0",
            }}
          >
            ARCHIVED
          </p>
          {order.map((uuid, index) => {
            const note = notes.get(uuid);
            if (!note.labels.includes(labelObj?.uuid) || note.isTrash)
              return null;
            return (
              <NoteWrapper
                key={note.uuid}
                note={note}
                noteActions={noteActions}
                fadingNotes={fadingNotes}
                setFadingNotes={setFadingNotes}
                index={index}
                dispatchNotes={dispatchNotes}
                setTooltipAnchor={setTooltipAnchor}
                openSnackFunction={openSnackFunction}
                setSelectedNotesIDs={setSelectedNotesIDs}
                handleNoteClick={handleNoteClick}
                handleSelectNote={handleSelectNote}
                calculateLayout={calculateLayout}
              />
            );
          })}
        </div>
        <div className="empty-page">
          {notesReady && notesExist && (
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
              <div className="empty-page-dynamic-label" />
              No notes with this label yet
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
};

export default memo(DynamicLabel);
