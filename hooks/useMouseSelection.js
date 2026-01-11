import { useAppContext } from "@/context/AppContext";
import { useEffect, useRef, useCallback } from "react";

export function useMouseSelection({
  notesStateRef,
  visibleItems,
  selectedNotesRef,
  selectionBoxRef,
  ctrlDownRef,
  isDraggingRef,
  rootContainerRef,
}) {
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);
  const prevSelectedRef = useRef(null);
  const animationFrameRef = useRef(null);
  const notePositionsRef = useRef(new Map());
  const pendingChangesRef = useRef({ select: new Set(), deselect: new Set() });
  const lastUpdateTime = useRef(0);
  const { initialLoading, currentSection, isExpanded } = useAppContext();

  // Cache note positions to avoid expensive getBoundingClientRect calls
  const cacheNotePositions = useCallback(() => {
    notePositionsRef.current.clear();
    if (!notesStateRef.current?.order) return;

    notesStateRef.current.order.forEach((noteUUID) => {
      const note = notesStateRef.current.notes.get(noteUUID);
      if (note?.ref?.current) {
        const rect = note?.ref.current.getBoundingClientRect();
        notePositionsRef.current.set(noteUUID, {
          left: rect.left + window.scrollX,
          top: rect.top + window.scrollY,
          right: rect.left + window.scrollX + rect.width,
          bottom: rect.top + window.scrollY + rect.height,
        });
      }
    });
  }, [notesStateRef]);

  // Batch apply selection changes to reduce DOM events
  const applyPendingChanges = useCallback(() => {
    const { select, deselect } = pendingChangesRef.current;

    if (select.size === 0 && deselect.size === 0) return;

    // Apply changes to the ref
    select.forEach((uuid) => selectedNotesRef.current.add(uuid));
    deselect.forEach((uuid) => selectedNotesRef.current.delete(uuid));

    // Single batch event instead of individual events
    if (select.size > 0 || deselect.size > 0) {
      window.dispatchEvent(
        new CustomEvent("batchSelection", {
          detail: {
            select: Array.from(select),
            deselect: Array.from(deselect),
          },
        })
      );
    }

    // Clear pending changes
    pendingChangesRef.current = { select: new Set(), deselect: new Set() };
  }, [selectedNotesRef]);

  // Optimized collision detection with spatial filtering
  const updateSelection = useCallback(
    (selectionRect) => {
      const { left: newX, top: newY, width, height } = selectionRect;

      // Early exit for tiny selections
      if (width < 5 || height < 5) return;

      const selectionRight = newX + width;
      const selectionBottom = newY + height;

      // Only check notes that could possibly intersect (spatial filtering)
      notePositionsRef.current.forEach((pos, noteUUID) => {
        const note = notesStateRef.current.notes.get(noteUUID);
        if (!note) return;

        // Quick AABB intersection test
        const overlaps = !(
          pos.right < newX ||
          pos.left > selectionRight ||
          pos.bottom < newY ||
          pos.top > selectionBottom
        );

        const isCurrentlySelected = selectedNotesRef.current.has(noteUUID);
        const wasPreviouslySelected = prevSelectedRef.current?.has(noteUUID);

        if (overlaps && !isCurrentlySelected) {
          pendingChangesRef.current.select.add(noteUUID);
          pendingChangesRef.current.deselect.delete(noteUUID);
        } else if (!overlaps && isCurrentlySelected) {
          // Don't deselect if Ctrl is held and note was previously selected
          const shouldSkip = ctrlDownRef.current && wasPreviouslySelected;

          if (!shouldSkip) {
            pendingChangesRef.current.deselect.add(noteUUID);
            pendingChangesRef.current.select.delete(noteUUID);
          }
        }
      });
    },
    [notesStateRef, selectedNotesRef, ctrlDownRef]
  );

  // Throttled mousemove handler
  const handleMouseMove = useCallback(
    (e) => {
      if (!isMouseDown.current) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const pageX = e.pageX;
        const pageY = e.pageY;
        const start = dragStartRef.current;
        const box = selectionBoxRef.current;

        // Minimum distance threshold before starting selection
        if (Math.abs(pageX - start.x) < 10 && Math.abs(pageY - start.y) < 10) {
          if (box) {
            box.style.removeProperty("display");
          }
          return;
        }

        isDraggingRef.current = true;
        document.body.style.userSelect = "none";

        if (!box) return;

        box.style.display = "block";

        const newX = Math.min(pageX, start.x);
        const newY = Math.min(pageY, start.y);
        const width = Math.abs(pageX - start.x);
        const height = Math.abs(pageY - start.y);

        // Update selection box position
        box.style.left = newX + "px";
        box.style.top = newY + "px";
        box.style.width = width + "px";
        box.style.height = height + "px";

        // Throttle selection updates (max 60fps)
        const now = performance.now();
        if (now - lastUpdateTime.current >= 16) {
          // ~60fps
          updateSelection({ left: newX, top: newY, width, height });
          applyPendingChanges();
          lastUpdateTime.current = now;
        }
      });
    },
    [updateSelection, applyPendingChanges, visibleItems]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return; // Only handle left mouse button

      if (
        currentSection?.toLowerCase() === "labels" ||
        initialLoading ||
        (isExpanded.open && isExpanded.threshold === "before")
      )
        return;

      const parent = rootContainerRef.current;
      const container =
        rootContainerRef.current?.querySelector(".section-container");
      const target = e.target;

      // Elements that should not trigger selection
      const nav = document.body.querySelector("nav");
      const aside = document.body.querySelector("aside");
      const menu = document.getElementById("menu");
      const modal = document.getElementById("modal-portal");
      const tooltip = document.querySelector("[role='tooltip']");

      const skip =
        (parent?.contains(target) &&
          target !== parent &&
          target !== container) ||
        nav?.contains(target) ||
        aside?.contains(target) ||
        menu?.contains(target) ||
        modal?.contains(target) ||
        tooltip?.contains(target);

      if (skip) return;

      // Cache note positions at start of selection
      cacheNotePositions();

      isMouseDown.current = true;
      prevSelectedRef.current = new Set(selectedNotesRef.current);
      dragStartRef.current = {
        x: e.pageX,
        y: e.pageY,
      };

      // Initialize selection box
      const box = selectionBoxRef.current;
      if (box) {
        box.style.left = e.pageX + "px";
        box.style.top = e.pageY + "px";
        box.style.width = "0px";
        box.style.height = "0px";
      }
    },
    [
      cacheNotePositions,
      selectedNotesRef,
      rootContainerRef,
      initialLoading,
      currentSection,
      isExpanded,
    ]
  );

  const handleMouseUp = useCallback(() => {
    isMouseDown.current = false;
    document.body.style.removeProperty("user-select");

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Apply any remaining pending changes
    applyPendingChanges();

    // Clean up selection box
    const box = selectionBoxRef.current;
    if (box) {
      box.removeAttribute("style");
    }

    // Small delay to prevent click events from firing immediately
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 10);
  }, [applyPendingChanges]);

  // Handle window scroll during selection
  const handleScroll = useCallback(() => {
    if (isMouseDown.current) {
      // Recache positions on scroll during selection
      cacheNotePositions();
    }
  }, [cacheNotePositions]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("scroll", handleScroll);

      // Clean up any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp, handleScroll]);

  // Expose method to manually refresh positions (useful after layout changes)
  const refreshPositions = useCallback(() => {
    cacheNotePositions();
  }, [cacheNotePositions]);

  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(() => {
        cacheNotePositions();
      });
    };

    handler();

    window.addEventListener("resize", handler);

    return () => window.removeEventListener("resize", handler);
  }, [visibleItems]);

  return { refreshPositions };
}
