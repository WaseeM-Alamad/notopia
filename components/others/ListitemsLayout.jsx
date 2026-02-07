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
import handleServerCall from "@/utils/handleServerCall";
import { useAppContext } from "@/context/AppContext";

const ListItemsLayout = ({
  setLocalNote,
  localNote,
  ignoreTopRef,
  dispatchNotes,
  isOpen,
}) => {
  const { clientID, openSnackRef } = useAppContext();
  const renderCBdivider =
    localNote?.checkboxes.some((cb) => cb.isCompleted) &&
    localNote?.checkboxes.some((cb) => !cb.isCompleted);
  const activeItems = localNote?.checkboxes.filter((cb) => !cb.isCompleted);
  const completedItems = localNote?.checkboxes.filter((cb) => cb.isCompleted);
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

  const checkboxesRef = useRef(null);

  useEffect(() => {
    calculateVerticalLayout();
    checkboxesRef.current = localNote?.checkboxes;
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

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "expandCompleted",
            value: val,
            noteUUIDs: [localNote?.uuid],
            clientID: clientID,
          }),
      ],
      openSnackRef.current,
    );
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
      updatedAt: new Date(),
    }));

    requestAnimationFrame(() => {
      lastListItemRef.current.innerText = text;
      lastListItemRef.current.focus();
      placeCursorAtEnd(lastListItemRef.current);
    });

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "checkboxes",
            operation: "ADD",
            value: checkbox,
            noteUUIDs: [localNote?.uuid],
            clientID: clientID,
          }),
      ],
      openSnackRef.current,
    );
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
    async (e, checkboxUUID, value, parentUUID) => {
      e.stopPropagation();

      setLocalNote((prev) => ({
        ...prev,
        checkboxes: prev.checkboxes.map((cb) => {
          if (cb.uuid === checkboxUUID || cb.parent === checkboxUUID) {
            return { ...cb, isCompleted: value };
          } else if (parentUUID && cb.uuid === parentUUID && value === false) {
            return { ...cb, isCompleted: false };
          }
          return cb;
        }),
        updatedAt: new Date(),
      }));

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "checkboxes",
              operation: "MANAGE_COMPLETED",
              value: value,
              checkboxUUID: checkboxUUID,
              noteUUIDs: [localNote?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current,
      );
    },
    [localNote?.uuid],
  );

  const updateListItemContent = useCallback(
    debounce(async (text, cbUUID) => {
      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "checkboxes",
              operation: "UPDATE_CONTENT",
              value: text,
              checkboxUUID: cbUUID,
              noteUUIDs: [localNote?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current,
      );
    }, 600),
    [localNote?.uuid],
  );

  const draggedIndexRef = useRef(null);
  const draggedItemRef = useRef(null);
  const childrenUUIDRef = useRef([]);
  const childrenRef = useRef([]);
  const overIndexRef = useRef(null);
  const lastSwapRef = useRef(0);
  const endIndexRef = useRef(null);
  const isDraggingRef = useRef(null);
  const ghostElementRef = useRef(null);
  const draggedElementRef = useRef(null);
  const initialXRef = useRef(null);

  const handleDragStart = useCallback(
    (e, targetElement, index, draggedItem) => {
      if (isDraggingRef.current) {
        return;
      }
      const childrenElements = [];
      const initialState = draggedItem.parent ? "right" : "left";
      nestingZoneRef.current = initialState;
      childrenUUIDRef.current = [];
      checkboxesRef.current.forEach((cb, i) => {
        if (cb.isCompleted || cb.parent !== draggedItem.uuid) return;
        childrenUUIDRef.current.push(cb.uuid);
        childrenRef.current.push(cb);
        const ref = itemRefs.current[i];
        childrenElements.push(ref);
        ref.style.display = "none";
      });
      calculateVerticalLayout();
      draggedItemRef.current = draggedItem;
      ignoreTopRef.current = true;
      initialXRef.current = e.clientX;
      isDraggingRef.current = true;
      draggedIndexRef.current = index;
      ghostElementRef.current = targetElement.cloneNode(true);
      draggedElementRef.current = targetElement;
      const draggedElement = targetElement;
      const ghostElement = ghostElementRef.current;
      const draggedRect = draggedElement.getBoundingClientRect();
      const container = containerRef.current;
      draggedElement.children[0].classList.add("dragged-element");
      document.body.appendChild(ghostElement);
      document.body.classList.add("dragging");
      container.classList.add("items-container-transition");
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
          if (endIndexRef.current !== null && endIndexRef.current !== index) {
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
          calculateOnEnd(initialState, index, draggedItem);
          ignoreTopRef.current = false;
          ghostElement.classList.remove("ghost-list-item");
          ghostElement.classList.add("restore-ghost-list-item");
          const finalDragRect = draggedElement.getBoundingClientRect();
          ghostElement.style.boxShadow = "none";
          ghostElement.style.top = `${finalDragRect.top}px`;
          ghostElement.style.transform = "none";
          isDraggingRef.current = false;
          childrenRef.current = [];
          requestAnimationFrame(() => {
            setTimeout(() => {
              setTimeout(() => {
                draggedElement.children[0].classList.remove("dragged-element");
                document.body.removeChild(ghostElement);
                if (document.body.classList.contains("dragging")) {
                  document.body.classList.remove("dragging");
                }
                setTimeout(() => {
                  container.classList.remove("items-container-transition");
                }, 100);

                calculateVerticalLayout();
                childrenElements.forEach((ref) => {
                  ref.removeAttribute("style");
                });
                draggedIndexRef.current = null;
                overIndexRef.current = null;
                endIndexRef.current = null;
                ghostElementRef.current = null;
                draggedElementRef.current = null;
                draggedItemRef.current = null;
                overItemRef.current = null;
              }, 250);
            }, 50);
          });
        }

        document.removeEventListener("mousemove", updateGhostPosition);
        document.removeEventListener("mouseup", handleDragEnd);
      };

      document.addEventListener("mouseup", handleDragEnd);
    },
    [localNote?.color],
  );

  const calculateOnEnd = async (initialState, initialIndex, draggedItem) => {
    if (!checkboxesRef.current || checkboxesRef.current.length < 1) return;
    let draggedNewParent = null;
    let draggedOldParent = null;
    let prevItem = null;

    const updatedItems = new Map();
    const indexData = [];

    const updatePrev = (updatedItem) => {
      updatedItems.set(updatedItem.uuid, updatedItem.parent);
      prevItem = updatedItem;
      return updatedItem;
    };

    const oldList = checkboxesRef.current;
    const newList = oldList.map((currentItem, index) => {
      if (
        initialIndex !== index &&
        currentItem.uuid === draggedItem.uuid &&
        (currentItem.uuid === draggedItem.uuid ||
          currentItem.parent === draggedItem.uuid)
      ) {
        indexData.push({ uuid: currentItem.uuid, index: index });
      }

      const prevIndex = index - 1;

      if (prevIndex < 0) {
        const updatedItem = { ...currentItem, parent: null };
        prevItem = updatedItem;
        return updatedItem;
      }

      if (nestingZoneRef.current !== initialState) {
        if (nestingZoneRef.current === "right") {
          if (currentItem.uuid === draggedItem.uuid) {
            const parent = prevItem.parent || prevItem.uuid;
            draggedNewParent = parent;
            const updatedItem = { ...currentItem, parent: parent };
            return updatePrev(updatedItem);
          } else if (
            currentItem.parent === draggedItem.uuid &&
            !currentItem.isCompleted &&
            draggedNewParent
          ) {
            const updatedItem = { ...currentItem, parent: draggedNewParent };
            return updatePrev(updatedItem);
          }
        } else {
          if (currentItem.uuid === draggedItem.uuid) {
            draggedOldParent = draggedItem.parent;
            const updatedItem = { ...currentItem, parent: null };
            return updatePrev(updatedItem);
          } else if (
            currentItem.parent === draggedOldParent &&
            draggedOldParent
          ) {
            const updatedItem = { ...currentItem, parent: draggedItem.uuid };
            return updatePrev(updatedItem);
          }
        }
      }

      if (currentItem.parent && !currentItem.isCompleted) {
        const parent = prevItem.parent || prevItem.uuid;
        if (currentItem.parent !== parent) {
          const updatedItem = { ...currentItem, parent: parent };
          return updatePrev(updatedItem);
        }
      }

      prevItem = currentItem;
      return currentItem;
    });
    setLocalNote((prev) => ({
      ...prev,
      checkboxes: newList,
      updatedAt:
        initialIndex !== draggedIndexRef.current || updatedItems.size > 0
          ? new Date()
          : prev.updatedAt,
    }));

    const reOrder =
      initialIndex !== draggedIndexRef.current && overItemRef?.current?.uuid;

    if (initialIndex !== draggedIndexRef.current || updatedItems.size > 0) {
      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "checkboxes",
              operation: "UPDATE_ORDER-FAM",
              overItemUUID: overItemRef?.current?.uuid,
              reOrder: reOrder,
              parentUUID: draggedItem.uuid,
              updatedItems: updatedItems,
              noteUUIDs: [localNote?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current,
      );
    }
  };

  const overItemRef = useRef(null);

  const moveParentGroup = (list, parentIndex, overIndex) => {
    const parent = list[parentIndex];
    if (!parent) return list; // only move full parent groups

    overItemRef.current = list[overIndex];

    const newList = [...list];

    const filteredList = newList.filter((cb, i) => {
      if (cb.uuid === parent.uuid) {
        return false;
      }
      if (childrenUUIDRef.current.includes(cb.uuid)) {
        return false;
      }
      return true;
    });

    const itemsToInsert = [parent, ...childrenRef.current];
    if (overIndex < parentIndex) {
      filteredList.splice(overIndex, 0, ...itemsToInsert);
      draggedIndexRef.current = overIndexRef.current;
    } else {
      filteredList.splice(
        overIndex - childrenRef.current.length,
        0,
        ...itemsToInsert,
      );
      draggedIndexRef.current =
        overIndexRef.current - childrenRef.current.length;
    }

    return filteredList;
  };

  const handleDragOver = async () => {
    if (
      !isDraggingRef.current ||
      draggedIndexRef.current == null ||
      overIndexRef.current == null
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastSwapRef.current < 150) return;

    lastSwapRef.current = now;

    if (draggedIndexRef.current === null || overIndexRef.current === null)
      return;
    endIndexRef.current = overIndexRef.current;

    // const overItem = checkboxesRef.current[overIndexRef.current];
    // {
    //   console.log("overitem", overItem.parent);
    //   console.log("draggedItem", draggedItemRef.current.uuid);
    //   if (draggedItemRef.current.uuid === overItem.parent) return;
    // }
    // Copy notes to avoid mutating state directly

    const newList = moveParentGroup(
      checkboxesRef.current,
      draggedIndexRef.current,
      overIndexRef.current,
    );

    setLocalNote((prev) => ({ ...prev, checkboxes: newList }));
  };

  const nestingZoneRef = useRef("left");

  const handleNesting = (mouseX) => {
    const diff = mouseX - initialXRef.current;
    if (draggedIndexRef.current) {
      if (diff > 23 && nestingZoneRef.current !== "right") {
        nestingZoneRef.current = "right";
        ghostElementRef.current.style.paddingLeft = "1.3rem";
      } else if (diff < -2 && nestingZoneRef.current !== "left") {
        nestingZoneRef.current = "left";
        ghostElementRef.current.style.paddingLeft = "0rem";
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const overElement = document
        ?.elementFromPoint(mouseX, mouseY)
        ?.closest(".list-item");

      handleNesting(mouseX);

      if (!overElement || overElement === draggedElementRef.current) return;
      handleDragOver();
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [localNote]);

  const activeParentItems = activeItems?.filter((item) => item.parent === null);

  const completedParentItems = completedItems?.filter(
    (item) => item.parent === null,
  );

  const getCompletedChildren = (parentUUID) => {
    return completedItems?.filter((item) => item.parent === parentUUID);
  };

  const getCompletedChildrenForActiveParent = (parentUUID) => {
    return completedItems?.filter((item) => item.parent === parentUUID);
  };

  return (
    <>
      {/* <button
        style={{
          padding: "0.8rem",
          backgroundColor: "transparent",
          border: "none",
        }}
        onClick={() => console.log(localNote.checkboxes)}
      >
        log items
      </button> */}
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
            {completedItems.length > 0 && (
              <div className="checkboxes-divider" style={{ width: "90%" }} />
            )}
          </div>
          {completedItems.length > 0 && (
            <div
              onClick={handleExpand}
              className="completed-items"
              aria-label={`${completedItems.length} Completed item${
                completedItems.length === 1 ? "" : "s"
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
            completedParentItems.map((parent, index) => (
              <div key={`completed-parent-item-${parent.uuid}`}>
                <ListItem
                  no={true}
                  dispatchNotes={dispatchNotes}
                  handleCheckboxClick={handleCheckboxClick}
                  updateListItemContent={updateListItemContent}
                  checkbox={parent}
                  itemRefs={itemRefs}
                  handleDragStart={handleDragStart}
                  modalOpen={isOpen}
                  setLocalNote={setLocalNote}
                  noteUUID={localNote?.uuid}
                  index={index}
                />

                {getCompletedChildren(parent.uuid).map((child, childIndex) => (
                  <ListItem
                    key={child.uuid}
                    no={true}
                    dispatchNotes={dispatchNotes}
                    handleCheckboxClick={handleCheckboxClick}
                    updateListItemContent={updateListItemContent}
                    checkbox={child}
                    itemRefs={itemRefs}
                    handleDragStart={handleDragStart}
                    modalOpen={isOpen}
                    setLocalNote={setLocalNote}
                    noteUUID={localNote?.uuid}
                    index={childIndex}
                  />
                ))}
              </div>
            ))}

          {activeParentItems.map((parent, index) => {
            const completedChildren = getCompletedChildrenForActiveParent(
              parent.uuid,
            );
            if (completedChildren.length === 0) return null;

            return (
              <div key={`active-parent-item-${parent.uuid}`}>
                <ListItem
                  no={true}
                  dispatchNotes={dispatchNotes}
                  handleCheckboxClick={() => {}}
                  disabled={true}
                  updateListItemContent={updateListItemContent}
                  checkbox={parent}
                  itemRefs={itemRefs}
                  handleDragStart={handleDragStart}
                  modalOpen={isOpen}
                  setLocalNote={setLocalNote}
                  noteUUID={localNote?.uuid}
                  index={index}
                />

                {completedChildren.map((child, childIndex) => (
                  <ListItem
                    key={child.uuid}
                    no={true}
                    dispatchNotes={dispatchNotes}
                    handleCheckboxClick={handleCheckboxClick}
                    updateListItemContent={updateListItemContent}
                    checkbox={child}
                    itemRefs={itemRefs}
                    handleDragStart={handleDragStart}
                    modalOpen={isOpen}
                    setLocalNote={setLocalNote}
                    noteUUID={localNote?.uuid}
                    index={childIndex}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default memo(ListItemsLayout);
