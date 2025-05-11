import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ListItem from "./ListItem";
import { debounce } from "lodash";
import { NoteUpdateAction } from "@/utils/actions";
import { v4 as uuid } from "uuid";

const ListItemsLayout = ({
  setLocalNote,
  localNote,
  dispatchNotes,
  isOpen,
}) => {
  const renderCBdivider =
    localNote?.checkboxes.some((cb) => cb.isCompleted) &&
    localNote?.checkboxes.some((cb) => !cb.isCompleted);
  const completedItemsCount = localNote?.checkboxes.reduce((acc, cb) => {
    return cb.isCompleted ? acc + 1 : acc;
  }, 0);
  const layoutFrameRef = useRef(null);
  const itemRefs = useRef({});
  const containerRef = useRef(null);
  const lastListItemRef = useRef(null);

  const GUTTER = 0;

  const calculateVerticalLayout = useCallback(() => {
    if (!itemRefs?.current) {
      return;
    }
    if (layoutFrameRef.current) {
      cancelAnimationFrame(layoutFrameRef.current);
    }

    layoutFrameRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;

      container.style.position = "relative";

      let y = 0;
      Object.entries(itemRefs.current).forEach(([uuid, ref]) => {
        if (!ref) return;
        ref.style.position = "absolute";
        ref.style.transform = `translateY(${y}px)`;
        y += ref.offsetHeight + GUTTER;
      });

      container.style.height = `${y}px`;
    });
  }, []);

  useEffect(() => {
    calculateVerticalLayout();
  }, [localNote?.checkboxes]);

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  function placeCursorAtEnd(el) {
    if (!el) return;
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false); // false = move to end
    sel.removeAllRanges();
    sel.addRange(range);
  }

  const handleExpand = async () => {
    const val = !localNote?.expandCompleted;
    setLocalNote((prev) => ({
      ...prev,
      expandCompleted: val,
    }));

    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction({
      type: "expandCompleted",
      value: val,
      noteUUIDs: [localNote?.uuid],
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const addListItem = async (text) => {
    const newUUID = uuid();
    const checkbox = {
      uuid: newUUID,
      content: text,
      isCompleted: false,
      parent: null,
      children: [],
    };

    setLocalNote((prev) => ({
      ...prev,
      checkboxes: [...prev.checkboxes, checkbox],
    }));

    requestAnimationFrame(() => {
      lastListItemRef.current.innerText = text;
      lastListItemRef.current.focus();
      placeCursorAtEnd(lastListItemRef.current);
    });

    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction({
      type: "checkboxes",
      operation: "ADD",
      value: checkbox,
      noteUUIDs: [localNote?.uuid],
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleNewListItemInput = (e) => {
    if (e.target.innerText.trim() === "") {
      e.target.innerText = "";
      return;
    }
    const text = e.target.innerText.trim();
    addListItem(text);
    e.target.innerText = "";
  };

  const handleCheckboxClick = useCallback(
    async (e, checkboxUUID, value) => {
      e.stopPropagation();
      setLocalNote((prev) => ({
        ...prev,
        checkboxes: prev.checkboxes.map((cb) => {
          return cb.uuid === checkboxUUID ? { ...cb, isCompleted: value } : cb;
        }),
      }));
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "checkboxes",
        operation: "MANAGE_COMPLETED",
        value: value,
        checkboxUUID: checkboxUUID,
        noteUUIDs: [localNote?.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    },
    [localNote?.uuid]
  );

  const updateListItemContent = useCallback(
    debounce(async (text, cbUUID) => {
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "checkboxes",
        operation: "UPDATE_CONTENT",
        value: text,
        checkboxUUID: cbUUID,
        noteUUIDs: [localNote?.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    }, 600),
    [localNote?.uuid]
  );

  const draggedIndexRef = useRef(null);
  const overIndexRef = useRef(null);
  const lastSwapRef = useRef(0);
  const endIndexRef = useRef(null);
  const isDraggingRef = useRef(null);
  const ghostElementRef = useRef(null);
  const draggedElementRef = useRef(null);
  const initialXRef = useRef(null);

  const handleDragStart = useCallback(
    (e, targetElement, index, itemUUID) => {
      if (isDraggingRef.current) {
        return;
      }
      initialXRef.current = e.clientX;
      isDraggingRef.current = true;
      draggedIndexRef.current = index;
      ghostElementRef.current = targetElement.cloneNode(true);
      draggedElementRef.current = targetElement;
      const draggedInitialIndex = index;
      const draggedElement = targetElement;
      const ghostElement = ghostElementRef.current;
      const draggedRect = draggedElement.getBoundingClientRect();
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      draggedElement.classList.add("dragged-element");
      document.body.appendChild(ghostElement);
      document.body.classList.add("dragging");
      ghostElement.classList.add("ghost-list-item");
      const grip = ghostElement.querySelector(".drag-db-area");
      if (grip) {
        grip.style.visibility = "visible";
      }
      ghostElement.classList.add(localNote?.color);
      ghostElement.style.left = `${draggedRect.left}px`;
      ghostElement.style.top = `${draggedRect.top}px`;
      ghostElement.style.transform = "none";
      ghostElement.style.width = draggedElement.offsetWidth + "px";
      requestAnimationFrame(() => {
        ghostElement.style.transition = "transform .13s ease";
        ghostElement.style.transform = "scale(1.02)";
      });

      const offsetY = e.clientY - draggedRect.top;

      const updateGhostPosition = (moveEvent) => {
        const mouseY = moveEvent.clientY - offsetY;
        const containerRect = container.getBoundingClientRect();
        const ghostRect = ghostElement.getBoundingClientRect();
        const containerY = {
          top: containerRect.top,
          bottom: containerRect.bottom - ghostRect.height,
        };

        if (mouseY < containerY.top) {
          ghostElement.style.top = `${containerY.top}px`;
        } else if (mouseY > containerY.bottom) {
          ghostElement.style.top = `${containerY.bottom}px`;
        } else {
          ghostElement.style.top = `${mouseY}px`;
        }
      };

      document.addEventListener("mousemove", updateGhostPosition);

      const handleDragEnd = () => {
        if (ghostElement && document.body.contains(ghostElement)) {
          if (
            endIndexRef.current !== null &&
            endIndexRef.current !== draggedInitialIndex
          ) {
            // window.dispatchEvent(new Event("loadingStart"));
            // NoteUpdateAction({
            //   type: "checkboxes",
            //   operation: "UPDATE_ORDER",
            //   initialIndex: draggedInitialIndex,
            //   endIndex: endIndexRef.current,
            //   checkboxUUID: itemUUID,
            //   noteUUIDs: [localNote?.uuid],
            // })
            //   .then(() => window.dispatchEvent(new Event("loadingEnd")))
            //   .catch((err) => {
            //     console.log(err);
            //   });
          }
          ghostElement.classList.remove("ghost-list-item");
          ghostElement.classList.add("restore-ghost-list-item");
          const finalDragRect = draggedElement.getBoundingClientRect();
          ghostElement.style.boxShadow = "none";
          ghostElement.style.top = `${finalDragRect.top}px`;
          ghostElement.style.transform = "none";
          isDraggingRef.current = false;
          requestAnimationFrame(() => {
            setTimeout(() => {
              setTimeout(() => {
                draggedElement.classList.remove("dragged-element");
                draggedElement.style.opacity = "1";
                document.body.removeChild(ghostElement);
                if (document.body.classList.contains("dragging")) {
                  document.body.classList.remove("dragging");
                }
                draggedIndexRef.current = null;
                overIndexRef.current = null;
                endIndexRef.current = null;
                ghostElementRef.current = null;
                draggedElementRef.current = null;
              }, 250);
            }, 50);
          });
        }

        document.removeEventListener("mousemove", updateGhostPosition);
        document.removeEventListener("mouseup", handleDragEnd);
      };

      document.addEventListener("mouseup", handleDragEnd);
    },
    [localNote.color]
  );

  const handleDragOver = async () => {
    if (!isDraggingRef.current) return;

    const now = Date.now();
    if (now - lastSwapRef.current < 150) return;

    lastSwapRef.current = now;

    if (draggedIndexRef.current === null || overIndexRef.current === null)
      return;
    endIndexRef.current = overIndexRef.current;

    const overItem = localNote.checkboxes[overIndexRef.current];
    {
      const draggedItem = localNote.checkboxes[draggedIndexRef.current];
      if (draggedItem.uuid === overItem.parent) return;
    }
    // Copy notes to avoid mutating state directly
    const orderedList = [...localNote?.checkboxes];
    const [draggedItem] = orderedList.splice(draggedIndexRef.current, 1);
    orderedList.splice(overIndexRef.current, 0, draggedItem);

    overIndexRef.current = draggedIndexRef.current;
    draggedIndexRef.current = endIndexRef.current;

    // console.log("dragged item", draggedItem.content);
    // console.log("dragged index", draggedIndexRef.current);
    // console.log("over item", overItem.content);
    // console.log("over index", overIndexRef.current);

    if (overItem.parent === draggedItem.parent) {
      setLocalNote((prev) => ({ ...prev, checkboxes: orderedList }));
      return;
    }

    const updatedList = orderedList.map((cb) => {
      console.log("loop");
      if (cb.uuid === draggedItem.uuid) {
        if (draggedItem.parent) {
          const aboveIndex = draggedIndexRef.current - 1;
          if (aboveIndex < 0) {
            ghostElementRef.current.style.paddingLeft = "0rem";
            return { ...cb, parent: null };
          }
          const aboveItem = orderedList[aboveIndex];
          // console.log("above index", aboveIndex);
          // console.log("above item", aboveItem);

          if (aboveItem.parent) {
            return { ...cb, parent: aboveItem.parent };
          } else {
            return { ...cb, parent: aboveItem.uuid };
          }
        }
      }

      return cb;
    });
    setLocalNote((prev) => ({ ...prev, checkboxes: updatedList }));
  };

  const nestingZoneRef = useRef("neutral");
  const indexMap = useMemo(() => {
    const map = new Map();
    localNote?.checkboxes.forEach((item, i) => map.set(item.uuid, i));
    return map;
  }, [localNote?.checkboxes]);

  const handleNesting = (mouseX) => {
    const diff = mouseX - initialXRef.current;
    if (draggedIndexRef.current) {
      const draggedItem = localNote?.checkboxes[draggedIndexRef.current];
      if (diff > 23 && nestingZoneRef.current !== "right") {
        nestingZoneRef.current = "right";
        let aboveIndex;
        for (let i = draggedIndexRef.current - 1; i >= 0; i--) {
          const cb = localNote?.checkboxes[i];
          if (cb.parent) continue;
          aboveIndex = i;
          break;
        }

        if (aboveIndex < 0 || aboveIndex === null) {
          return;
        }
        const aboveItem = localNote?.checkboxes[aboveIndex];

        if (!aboveItem) return;

        if (!draggedItem?.parent) {
          console.log("RIGHT");
          // window.dispatchEvent(new Event("loadingStart"));
          // NoteUpdateAction({
          //   type: "checkboxes",
          //   operation: "INDENT",
          //   parentUUID: aboveItem.uuid,
          //   childUUID: draggedItem.uuid,
          //   noteUUIDs: [localNote?.uuid],
          // })
          //   .then(() => window.dispatchEvent(new Event("loadingEnd")))
          //   .catch((er) => {
          //     window.dispatchEvent(new Event("loadingEnd"));
          //   });
          const updatedList = localNote?.checkboxes.map((cb, index) => {
            if (draggedItem.uuid === cb.uuid) {
              const updatedCB = { ...cb, parent: aboveItem.uuid };
              return updatedCB;
            }

            if (
              index > draggedIndexRef.current &&
              cb.parent === draggedItem.uuid
            ) {
              const updatedCB = { ...cb, parent: aboveItem.uuid };
              return updatedCB;
            }

            return cb;
          });
          ghostElementRef.current.style.paddingLeft = "1.3rem";
          setLocalNote((prev) => ({ ...prev, checkboxes: updatedList }));
        }
      } else if (diff < -2 && nestingZoneRef.current !== "left") {
        nestingZoneRef.current = "left";
        if (draggedItem?.parent) {
          // console.log("LEFT");
          // window.dispatchEvent(new Event("loadingStart"));
          // NoteUpdateAction({
          //   type: "checkboxes",
          //   operation: "UNINDENT",
          //   parentUUID: draggedItem.parent,
          //   childUUID: draggedItem.uuid,
          //   noteUUIDs: [localNote?.uuid],
          // })
          //   .then(() => window.dispatchEvent(new Event("loadingEnd")))
          //   .catch((er) => {
          //     window.dispatchEvent(new Event("loadingEnd"));
          //   });
          ghostElementRef.current.style.paddingLeft = "0rem";
          const updatedList = localNote?.checkboxes.map((cb, index) => {
            if (draggedItem.uuid === cb.uuid) {
              const updatedCB = { ...cb, parent: null };
              return updatedCB;
            }

            if (
              index > draggedIndexRef.current &&
              cb.parent === draggedItem.parent
            ) {
              const updatedCB = { ...cb, parent: draggedItem.uuid };
              return updatedCB;
            }

            return cb;
          });
          setLocalNote((prev) => ({ ...prev, checkboxes: updatedList }));
        }
      } else if (
        diff >= -23 &&
        diff <= 23 &&
        nestingZoneRef.current !== "neutral"
      ) {
        nestingZoneRef.current = "neutral";
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const overNoteElement = document
        ?.elementFromPoint(mouseX, mouseY)
        ?.closest(".note-checkbox-wrapper");

      handleNesting(mouseX);

      if (!overNoteElement || overNoteElement === draggedElementRef.current)
        return;
      handleDragOver();
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [localNote]);

  return (
    <>
      <button
        style={{
          padding: "0.8rem",
          backgroundColor: "transparent",
          border: "none",
        }}
        onClick={() => console.log(localNote.checkboxes)}
      >
        log items
      </button>
      {localNote?.checkboxes?.length > 0 && localNote?.showCheckboxes && (
        <div
          style={{
            paddingBottom: "1.2rem",
          }}
        >
          <div ref={containerRef}>
            {localNote?.checkboxes.map((checkbox, index) => {
              if (checkbox.isCompleted) return null;
              return (
                <ListItem
                  key={checkbox.uuid}
                  itemRefs={itemRefs}
                  overIndexRef={overIndexRef}
                  dispatchNotes={dispatchNotes}
                  handleCheckboxClick={handleCheckboxClick}
                  updateListItemContent={updateListItemContent}
                  checkbox={checkbox}
                  lastListItemRef={lastListItemRef}
                  handleDragStart={handleDragStart}
                  modalOpen={isOpen}
                  setLocalNote={setLocalNote}
                  noteUUID={localNote?.uuid}
                  index={index}
                />
              );
            })}
          </div>

          <div style={{ position: "relative" }}>
            <div className="add-item-icon" />
            <div
              contentEditable
              aria-multiline="true"
              onInput={handleNewListItemInput}
              suppressContentEditableWarning
              onPaste={handlePaste}
              className="add-list-item"
              aria-label="List item"
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {renderCBdivider && (
              <div className="checkboxes-divider" style={{ width: "90%" }} />
            )}
          </div>
          {completedItemsCount > 0 && (
            <div
              onClick={handleExpand}
              className="completed-items"
              aria-label={`${completedItemsCount} Completed item${
                completedItemsCount === 1 ? "" : "s"
              }`}
            >
              <div
                className={`completed-collapsed ${
                  localNote?.expandCompleted ? "completed-expanded" : ""
                }`}
              />
            </div>
          )}
          {localNote?.expandCompleted &&
            localNote?.checkboxes.map((checkbox, index) => {
              if (!checkbox.isCompleted) return null;
              return (
                <ListItem
                  key={checkbox.uuid}
                  dispatchNotes={dispatchNotes}
                  handleCheckboxClick={handleCheckboxClick}
                  updateListItemContent={updateListItemContent}
                  checkbox={checkbox}
                  handleDragStart={handleDragStart}
                  modalOpen={isOpen}
                  setLocalNote={setLocalNote}
                  noteUUID={localNote?.uuid}
                  index={index}
                />
              );
            })}
        </div>
      )}
    </>
  );
};

export default memo(ListItemsLayout);
