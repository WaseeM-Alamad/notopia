import { useAppContext } from "@/context/AppContext";
import { updateOrderAction } from "@/utils/actions";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import { useCallback, useEffect, useRef } from "react";

export function useNoteDragging({
  touchOverElementRef,
  isDraggingRef,
  handleDragStartRef,
  calculateLayout,
  notesStateRef,
  overIsPinnedRef,
  overIndexRef,
  dispatchNotes,
}) {
  const { layout, user, openSnackRef, clientID } = useAppContext();

  const userID = user?.id;

  let lastEl = null;
  let animationFrame;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let isFromBottom = false;

  const lastSwapRef = useRef(0);
  const ghostElementRef = useRef(null);
  const endIndexRef = useRef(null);
  const draggedNoteRef = useRef(null);
  const draggedIndexRef = useRef(null);
  const draggedIsPinnedRef = useRef(null);
  const pointerMovedRef = useRef(false);

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
    (e, targetElement, index, isPinned, isTouch = false) => {
      if (draggedNoteRef.current) {
        return;
      }
      isDraggingRef.current = true;
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

      ghostElement.style.left = `${rect.left - (isTouch ? 0 : 15)}px`;
      ghostElement.style.top = `${rect.top - (isTouch ? 0 : 15)}px`;

      const baseLeft = rect.left;
      const baseTop = rect.top;

      ghostElement.style.transform = `translate(${e.clientX - offsetX - baseLeft}px, ${e.clientY - offsetY - baseTop}px)`;

      const updateGhostPosition = (moveEvent) => {
        const x = moveEvent.clientX - offsetX - baseLeft;
        const y = moveEvent.clientY - offsetY - baseTop;
        ghostElement.style.transform = `translate(${layout === "grid" ? x : 0}px, ${y}px)`;
      };

      const updateGhostPositionTouch = (e) => {
        const t = e.touches[0];
        if (!t) return;

        const x = t.clientX - offsetX - baseLeft;
        const y = t.clientY - offsetY - baseTop;

        ghostElement.style.transform = `translate(${layout === "grid" ? x : 0}px, ${y}px)`;
      };

      isTouch &&
        document.addEventListener("touchmove", updateGhostPositionTouch, {
          passive: false,
        });

      document.addEventListener("mousemove", updateGhostPosition);

      const handleDragEnd = () => {
        if (ghostElement && document.body.contains(ghostElement)) {
          touchOverElementRef.current = null;
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
                openSnackRef.current,
              );
            }

            document
              .querySelector(".starting-div")
              ?.classList.remove("dragging");
            draggedElement.focus();
            const rect = draggedElement.getBoundingClientRect();
            ghostElement.classList.remove("ghost-note");
            ghostElement.classList.add("restore-ghost-note");
            ghostElement.style.top = `${rect.top}px`;
            ghostElement.style.left = `${rect.left}px`;
            pin.style.opacity = "0";
            isDraggingRef.current = false;
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
        isTouch &&
          document.removeEventListener("touchmove", updateGhostPositionTouch);
        document.removeEventListener("mousemove", updateGhostPosition);
        document.removeEventListener("mouseup", handleDragEnd);
        document.removeEventListener("touchend", handleDragEnd);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
        stopAutoScroll();
        cancelAnimationFrame(animationFrame);

        calculateLayout();
      };

      document.addEventListener("mouseup", handleDragEnd);
      isTouch && document.addEventListener("touchend", handleDragEnd);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      animationFrame = requestAnimationFrame(checkCollisions);
    },
    [calculateLayout, layout],
  );

  const handleDragOver = async (noteElement) => {
    if (!isDraggingRef.current) return;
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

  const checkCollisions = () => {
    if (!isDraggingRef.current) {
      animationFrame = requestAnimationFrame(checkCollisions);
      return;
    }

    if (!pointerMovedRef.current) {
      animationFrame = requestAnimationFrame(checkCollisions);
      return;
    }

    pointerMovedRef.current = false;

    const isGrid = layout === "grid";

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
          lastPointerX < lastElRect.left ||
          lastPointerX > lastElRect.right ||
          lastPointerY < lastElRect.top ||
          lastPointerY > lastElRect.bottom
        ) {
          lastEl = null;
        }
      }

      if (lastEl === noteElement) {
        let isEligible = false;
        const factor = Math.min(0.9, Math.max(0.65, height / 550));
        isEligible =
          lastPointerX >= rect.left &&
          lastPointerX <= rect.right &&
          lastPointerY >= rect.top + (isFromBottom ? height * factor : 0) &&
          lastPointerY <= rect.bottom + (isFromBottom ? 0 : height * -factor);

        if (isEligible) {
          if (!draggedNoteRef.current.contains(noteElement)) handleDragOver();
          break;
        }
      } else {
        if (
          lastPointerX >= rect.left &&
          lastPointerX <= rect.right &&
          lastPointerY >= rect.top &&
          lastPointerY <= rect.bottom
        ) {
          if (!draggedNoteRef.current.contains(noteElement)) {
            isFromBottom = lastPointerY > rect.top + rect.height * 0.5;
            handleDragOver(noteElement);
          }
          break;
        }
      }
    }

    animationFrame = requestAnimationFrame(checkCollisions);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;

    if (lastPointerX === e.clientX && lastPointerY === e.clientY) return;

    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    pointerMovedRef.current = true;
  };

  let scrollAnimationFrame = null;
  let currentScrollSpeed = 0;
  const SCROLL_EDGE = 80; // px from top/bottom
  const MAX_SCROLL_SPEED = 50;

  function smoothScroll() {
    if (currentScrollSpeed !== 0) {
      window.scrollBy(0, currentScrollSpeed);
      scrollAnimationFrame = requestAnimationFrame(smoothScroll);
    }
  }

  const handleTouchMove = (e) => {
    if (!e.cancelable) return;
    if (!isDraggingRef.current) return;
    e.preventDefault();

    const t = e.touches[0];
    if (!t) return;

    if (lastPointerX === t.clientX && lastPointerY === t.clientY) return;

    const limit = 100;

    const topLimit = limit;
    const bottomLimit = window.innerHeight - limit;

    if (t.clientY > topLimit && t.clientY < bottomLimit) {
      lastPointerX = t.clientX;
      lastPointerY = t.clientY;
      pointerMovedRef.current = true;
    }

    const y = t.clientY;
    const vh = window.innerHeight;

    let targetSpeed = 0;

    if (y < SCROLL_EDGE) {
      targetSpeed = -((SCROLL_EDGE - y) / SCROLL_EDGE) * MAX_SCROLL_SPEED;
    } else if (y > vh - SCROLL_EDGE) {
      targetSpeed = ((y - (vh - SCROLL_EDGE)) / SCROLL_EDGE) * MAX_SCROLL_SPEED;
    }

    currentScrollSpeed = targetSpeed;

    if (targetSpeed !== 0 && !scrollAnimationFrame) {
      scrollAnimationFrame = requestAnimationFrame(smoothScroll);
    } else if (targetSpeed === 0 && scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }
  };

  // Add this to your touchend/mouseup handler
  const stopAutoScroll = () => {
    currentScrollSpeed = 0;
    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }
  };

  useEffect(() => {
    handleDragStartRef.current = handleDragStart;
  }, [handleDragStart]);
}
