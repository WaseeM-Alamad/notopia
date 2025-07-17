import { useEffect, useRef } from "react";

export function useMouseSelection({
  notesStateRef,
  selectedNotesRef,
  selectionBoxRef,
  ctrlDownRef,
  isDraggingRef,
  rootContainerRef,
}) {
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);
  const prevSelectedRef = useRef(null);
  
  const handleMouseMove = (e) => {
    if (isMouseDown.current) {
      const pageX = e.pageX;
      const pageY = e.pageY;
      const start = dragStartRef.current;

      if (Math.abs(pageX - start.x) < 15 && Math.abs(pageY - start.y) < 15) {
        return;
      }

      isDraggingRef.current = true;
      document.body.style.userSelect = "none";

      const box = selectionBoxRef.current;
      box.style.display = "block";

      const newX = Math.min(pageX, start.x);
      const newY = Math.min(pageY, start.y);
      const width = Math.abs(pageX - start.x);
      const height = Math.abs(pageY - start.y);

      box.style.left = newX + "px";
      box.style.top = newY + "px";
      box.style.width = width + "px";
      box.style.height = height + "px";

      notesStateRef.current.order.forEach((noteUUID) => {
        const note = notesStateRef.current.notes.get(noteUUID);
        const noteRef = note?.ref;
        if (noteRef?.current) {
          const noteRect = noteRef.current.getBoundingClientRect();
          const noteLeft = noteRect.left + window.scrollX;
          const noteTop = noteRect.top + window.scrollY;
          const noteRight = noteLeft + noteRect.width;
          const noteBottom = noteTop + noteRect.height;

          const overlaps =
            noteRight > newX &&
            noteLeft < newX + width &&
            noteBottom > newY &&
            noteTop < newY + height;

          if (overlaps) {
            if (selectedNotesRef.current.has(note.uuid)) return;
            selectedNotesRef.current.add(note.uuid);
            window.dispatchEvent(
              new CustomEvent("selectNote", {
                detail: { uuid: note.uuid },
              })
            );
          } else {
            const shouldSkip =
              ctrlDownRef.current && prevSelectedRef.current.has(note.uuid);

            if (!shouldSkip) {
              selectedNotesRef.current.delete(note.uuid);
              window.dispatchEvent(
                new CustomEvent("deselectNote", {
                  detail: { uuid: note.uuid },
                })
              );
            }
          }
        }
      });
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;

    const parent = rootContainerRef.current;
    const container =
      rootContainerRef.current?.querySelector(".section-container");
    const target = e.target;
    const nav = document.body.querySelector("nav");
    const aside = document.body.querySelector("aside");
    const menu = document.getElementById("menu");
    const modal = document.getElementById("modal-portal");
    const tooltip = document.querySelector("[role='tooltip']");

    const skip =
      (parent?.contains(target) && target !== parent && target !== container) ||
      nav?.contains(target) ||
      aside?.contains(target) ||
      menu?.contains(target) ||
      modal?.contains(target) ||
      tooltip?.contains(target);

    if (skip) return;

    isMouseDown.current = true;
    prevSelectedRef.current = new Set(selectedNotesRef.current);
    dragStartRef.current = {
      x: e.pageX,
      y: e.pageY,
    };

    const box = selectionBoxRef.current;
    box.style.left = e.pageX + "px";
    box.style.top = e.pageY + "px";
  };

  const handleMouseUp = () => {
    isMouseDown.current = false;
    document.body.style.removeProperty("user-select");

    const box = selectionBoxRef.current;
    box.removeAttribute("style");

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 10);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
}
