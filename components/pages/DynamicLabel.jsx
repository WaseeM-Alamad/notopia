import { useAppContext } from "@/context/AppContext";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Note from "../others/Note";
import { motion } from "framer-motion";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";

const GUTTER = 15;
const GAP_BETWEEN_SECTIONS = 88;

const NoteWrapper = memo(
  ({
    dispatchNotes,
    openSnackFunction,
    selectedNotesRef,
    isGrid,
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
            note={note}
            noteActions={noteActions}
            selectedNotesRef={selectedNotesRef}
            setTooltipAnchor={setTooltipAnchor}
            calculateLayout={calculateLayout}
            setFadingNotes={setFadingNotes}
            setSelectedNotesIDs={setSelectedNotesIDs}
            handleSelectNote={handleSelectNote}
            openSnackFunction={openSnackFunction}
            index={index}
          />
        </div>
      </motion.div>
    );
  }
);

const DynamicLabel = ({
  visibleItems,
  setVisibleItems,
  dispatchNotes,
  notes,
  notesStateRef,
  selectedNotesRef,
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
  labelObj,
  setLabelObj,
  containerRef,
  isGrid,
}) => {
  const { labelsRef, labelsReady, layout } = useAppContext();
  const [pinnedHeight, setPinnedHeight] = useState(null);
  const [sectionsHeight, setSectionsHeight] = useState(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const labelObjRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const layoutFrameRef = useRef(null);
  const noteCount = labelObj?.noteCount ?? null;
  const stopLoadingBatchesRef = useRef(false);
  const COLUMN_WIDTH = layout === "grid" ? 240 : 600;

  const hasPinned = [...visibleItems].some((uuid) => {
    const note = notes.get(uuid);
    return note?.isPinned;
  });

  const hasUnpinned = [...visibleItems].some((uuid) => {
    const note = notes.get(uuid);
    return !note?.isPinned;
  });

  const hasArchivedNotes = [...visibleItems].some((uuid) => {
    const note = notes.get(uuid);
    return note?.isArchived;
  });

  const notesExist = order.some((uuid) => {
    const note = notes.get(uuid);
    if (!note?.labels?.includes(labelObj?.uuid) || note.isTrash) return false;
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
        labelObjRef.current = targetedLabel;
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

      setSectionsHeight(sectionGap);

      setPinnedHeight(pinnedHeight + GAP_BETWEEN_SECTIONS + 2);
      container.style.height = `${archivedHeight}px`;
      setLayoutReady(true);
    });
  }, [labelObj, isGrid]);

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

  useEffect(() => {
    calculateLayout();
  }, [visibleItems]);

  return (
    <>
      <div ref={rootContainerRef} className="starting-div">
        {labelsReady && (
          <div
            style={{
              height: "fit-content",
              padding: "3rem",
              display: "flex",
              gap: "0.6rem",
            }}
          >
            {labelObj?.image && (
              <img
                style={{ borderRadius: "0.7rem" }}
                width="150"
                src={labelObj?.image}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>
                <div
                  style={{
                    borderRadius: "50%",
                    width: "0.7rem",
                    border: "1px #212121 solid",
                    height: "0.7rem",
                    display: "inline-block",
                    marginRight: "0.3rem",
                  }}
                  className={`label-${labelObj?.color}`}
                />
                <span>{labelObj?.label}</span>
              </div>
              <div>
                {noteCount === null
                  ? "no notes"
                  : noteCount + (noteCount > 1 ? " notes" : " note")}
              </div>
              <div>{getNoteFormattedDate(labelObj?.createdAt)}</div>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="section-container"
          style={{ opacity: !layoutReady && "0" }}
        >
          <p
            className="section-label"
            style={{
              opacity: hasPinned ? "1" : "0",
              display: visibleItems.size === 0 && "none",
            }}
          >
            PINNED
          </p>
          <p
            className="section-label"
            style={{
              top: `${pinnedHeight}px`,
              opacity: hasPinned && hasUnpinned ? "1" : "0",
              display: visibleItems.size === 0 && "none",
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
            if (!visibleItems.has(note.uuid)) return null;
            if (!note.labels.includes(labelObj?.uuid) || note.isTrash)
              return null;
            return (
              <NoteWrapper
                key={note.uuid}
                note={note}
                selectedNotesRef={selectedNotesRef}
                noteActions={noteActions}
                fadingNotes={fadingNotes}
                isGrid={isGrid}
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
