"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLayout } from "./LayoutContext";
import { useAppContext } from "./AppContext";
import { useSearch } from "./SearchContext";

const MasonryContext = createContext();

export const MasonryProvider = ({
  children,
  order,
  notes,
  labelObj,
  visibleItems,
  containerRef,
}) => {
  const { notesStateRef, focusedIndex, currentSection } = useAppContext();
  const { filters, searchTerm } = useSearch();
  const { layout, breakpoint } = useLayout();

  const matchesFilters = (note) => {
    if (note?.isTrash) return false;

    if (filters.color && note?.color !== filters.color) {
      return false;
    }

    if (
      searchTerm &&
      !(
        note?.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        note?.content.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    ) {
      return false;
    }

    if (filters.label && !note?.labels.includes(filters.label)) {
      return false;
    }

    if (filters.image && note?.images.length === 0) {
      return false;
    }
    return true;
  };

  const isInCurrentSection = (note) => {
    switch (currentSection?.toLowerCase()) {
      case "home":
        return !note?.isArchived && !note?.isTrash;
      case "archive":
        return note?.isArchived && !note?.isTrash;
      case "trash":
        return note?.isTrash;
      case "search":
        return matchesFilters(note);
      case "dynamiclabel":
        return note?.labels?.includes(labelObj?.uuid) && !note?.isTrash;
    }
  };

  const [isGrid, setIsGrid] = useState(layout);
  const GAP_BETWEEN_SECTIONS = 88;
  const gridNoteWidth = breakpoint === 1 ? 240 : breakpoint === 2 ? 180 : 150;
  const COLUMN_WIDTH = isGrid ? gridNoteWidth : 600;
  const GUTTER = breakpoint === 1 ? 15 : 8;
  const [sectionsHeight, setSectionsHeight] = useState(null);
  const resizeTimeoutRef = useRef(null);

  const hasPinned = [...visibleItems].some((uuid) => {
    const note = notes.get(uuid);
    return note?.isPinned;
  });

  const hasUnpinned = [...visibleItems].some((uuid) => {
    const note = notes.get(uuid);
    if (!note) return false;
    return !note?.isPinned && !note?.isArchived;
  });

  const hasArchivedNotes = [...visibleItems].some((uuid) => {
    const note = notes.get(uuid);
    return note?.isArchived;
  });

  const [pinnedHeight, setPinnedHeight] = useState(null);
  const layoutFrameRef = useRef(null);

  const notesExist = order.some((uuid, index) => {
    const note = notes.get(uuid);
    if (!note) return false;
    if (!isInCurrentSection(note)) return false;
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

      const section = currentSection?.toLowerCase();
      const willCalcArchSection = [
        "search",
        "dynamiclabel",
        "archive",
      ].includes(section);
      const isArchSection = section === "archive";
      const isTrashSection = section === "trash";
      const isHomeSection = section === "home";

      const parent = container.parentElement;
      const parentWidth = parent.clientWidth;

      const columns = !isGrid
        ? 1
        : Math.max(1, Math.floor(parentWidth / (COLUMN_WIDTH + GUTTER)));
      const contentWidth = !isGrid
        ? COLUMN_WIDTH
        : columns * (COLUMN_WIDTH + GUTTER) - GUTTER;

      container.style.width = `${contentWidth}px`;
      container.style.maxWidth = isGrid ? "100%" : "95%";
      container.style.position = "relative";
      container.style.left = "50%";
      container.style.transform = "translateX(-50%)";

      const items = notesStateRef.current.order.map((uuid, index) => {
        const note = notesStateRef.current.notes.get(uuid);
        return { ...note, index: index };
      });

      const sortedItems = items.sort((a, b) => {
        return a.index - b.index;
      });

      let pinnedItems = [];

      if (!isArchSection && !isTrashSection) {
        pinnedItems = sortedItems.filter((item) => {
          if (!isInCurrentSection(item) || item.isTrash || item.isArchived)
            return false;
          return item.isPinned === true;
        });
      }

      let unpinnedItems = [];

      if (!isArchSection) {
        unpinnedItems = sortedItems.filter((item) => {
          if (
            !isInCurrentSection(item) ||
            (!isTrashSection && item.isTrash) ||
            item.isArchived
          )
            return false;
          return item.isPinned === false;
        });
      }

      let archivedItems = [];

      if (!isTrashSection && !isHomeSection) {
        archivedItems = sortedItems.filter((item) => {
          if (!isInCurrentSection(item) || item.isTrash) return false;
          return item.isArchived === true;
        });
      }

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

      let pinnedHeight = 0;
      if (!isArchSection) {
        pinnedHeight = positionItems(pinnedItems, pinnedItems.length > 0 && 30);
      }

      const unpinnedGap = pinnedItems.length > 0 ? GAP_BETWEEN_SECTIONS : 0;
      const unpinnedHeight = positionItems(
        unpinnedItems,
        pinnedHeight + unpinnedGap,
      );

      const archivedGap =
        unpinnedItems.length > 0 || pinnedItems.length > 0
          ? pinnedItems.length > 0 && unpinnedItems.length === 0
            ? 0
            : GAP_BETWEEN_SECTIONS
          : 0;

      let archivedHeight = 0;

      const archivedY = isArchSection ? 0 : unpinnedHeight + archivedGap || 30;

      if (willCalcArchSection) {
        archivedHeight = positionItems(archivedItems, archivedY);
      }

      const sectionGap =
        (pinnedItems.length > 0 && unpinnedItems.length === 0
          ? unpinnedHeight - GAP_BETWEEN_SECTIONS
          : unpinnedHeight) +
        (pinnedItems.length > 0 || unpinnedItems.length > 0
          ? GAP_BETWEEN_SECTIONS + 2
          : 32);

      setSectionsHeight(willCalcArchSection ? sectionGap - 16 : unpinnedHeight);

      setPinnedHeight(pinnedHeight + GAP_BETWEEN_SECTIONS + 2 - 16);
      container.style.height = `${willCalcArchSection ? archivedHeight : unpinnedHeight}px`;
    });
  }, [
    labelObj,
    isGrid,
    COLUMN_WIDTH,
    GUTTER,
    currentSection,
    filters,
    visibleItems,
  ]);

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
  }, [
    calculateLayout,
    debouncedCalculateLayout,
    labelObj,
    visibleItems,
    order,
    notes,
  ]);

  useEffect(() => {
    setTimeout(() => {
      setIsGrid(layout === "grid");
    }, 10);
  }, [layout]);

  return (
    <MasonryContext.Provider
      value={{
        pinnedHeight,
        hasPinned,
        hasUnpinned,
        hasArchivedNotes,
        calculateLayout,
        GUTTER,
        isGrid,
        gridNoteWidth,
        sectionsHeight,
        layoutFrameRef,
        notesExist,
      }}
    >
      {children}
    </MasonryContext.Provider>
  );
};

export const useMasonry = () => useContext(MasonryContext);
