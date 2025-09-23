import React, { memo, useEffect, useRef } from "react";
import Button from "../Tools/Button";
import { NoteUpdateAction } from "@/utils/actions";
import { useAppContext } from "@/context/AppContext";
import handleServerCall from "@/utils/handleServerCall";

const ListItem = ({
  no = false,
  handleCheckboxClick,
  updateListItemContent,
  noteUUID,
  checkbox,
  handleDragStart,
  itemRefs,
  lastListItemRef,
  overIndexRef,
  setLocalNote,
  modalOpen,
  index,
}) => {
  const { clientID, showTooltip, hideTooltip, closeToolTip, openSnackRef } =
    useAppContext();
  const listItemRef = useRef(null);
  const containerRef = useRef(null);
  const inputTimeoutRef = useRef(null);

  const setRefs = (element) => {
    listItemRef.current = element;
    if (lastListItemRef) lastListItemRef.current = element;
  };

  useEffect(() => {
    if (!modalOpen && inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
      const text = listItemRef.current.innerText;
      const t = text.trim() === "\n" ? "" : text;
      //   console.log(checkbox)
      setLocalNote((prev) => ({
        ...prev,
        checkboxes: prev.checkboxes.map((cb) =>
          cb.uuid === checkbox.uuid ? { ...cb, content: t } : cb
        ),
      }));
    }
  }, [modalOpen]);

  useEffect(() => {
    if (!listItemRef.current) return;

    listItemRef.current.innerText = checkbox.content;
  }, []);

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const handleListInput = (e) => {
    const text = e.target.innerText;
    const t = text === "\n" ? "" : text;

    clearTimeout(inputTimeoutRef.current);
    setLocalNote((prev) => ({
      ...prev,
      checkboxes: prev.checkboxes.map((cb) =>
        cb.uuid === checkbox.uuid ? { ...cb, content: t } : cb
      ),
      updatedAt: new Date(),
    }));
    updateListItemContent(t, checkbox.uuid);

    if (text === "\n") {
      e.target.innerText = "";
    }
  };

  const handleDelete = async () => {
    closeToolTip();
    setLocalNote((prev) => ({
      ...prev,
      checkboxes: prev.checkboxes.filter((cb) => {
        if (cb.uuid === checkbox.uuid) return false;

        if (cb.parent === checkbox.uuid) return false;

        return true;
      }),
      updatedAt: new Date(),
    }));

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "checkboxes",
            operation: "DELETE_CHECKBOX",
            checkboxUUID: checkbox.uuid,
            noteUUIDs: [noteUUID],
            clientID: clientID,
          }),
      ],
      openSnackRef.current
    );
  };

  let startX, startY;

  const handleMouseDown = (e) => {
    if (e.button !== 0 || checkbox.isCompleted) {
      return;
    }

    startX = e.clientX;
    startY = e.clientY;
    const targetElement = itemRefs.current[index];
    const target = e.target;

    const detectDrag = (event) => {
      const deltaX = Math.abs(event.clientX - startX);
      const deltaY = Math.abs(event.clientY - startY);

      if (deltaX > 5 || deltaY > 5) {
        handleDragStart(e, targetElement, index, checkbox);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", detectDrag);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", detectDrag);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseEnter = () => {
    if (no) return;
    overIndexRef.current = index;
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      ref={(el) => {
        if (no) {
          return;
        } else {
          itemRefs.current[index] = el;
        }
      }}
      className={`list-item ${checkbox?.parent ? "child-list-item" : ""}`}
    >
      <div
        className={`checkbox-wrapper note-checkbox-wrapper modal-checkbox-wrapper`}
      >
        {!no && <div onMouseDown={handleMouseDown} className="drag-db-area" />}
        <Button
          onMouseEnter={(e) => showTooltip(e, "Delete")}
          onMouseLeave={hideTooltip}
          onClick={handleDelete}
          className="delete-list-item"
        />
        {/* <div className="clear-icon"/> */}
        <div
          onClick={(e) =>
            handleCheckboxClick(e, checkbox.uuid, !checkbox.isCompleted)
          }
          className={`note-checkbox checkbox-unchecked ${
            checkbox.isCompleted ? "checkbox-checked" : ""
          }`}
        />
        <div
          dir="auto"
          contentEditable
          spellCheck="false"
          style={{
            width: "100%",
            paddingLeft: "0.5rem",
            fontSize: "1rem",
          }}
          onPaste={handlePaste}
          aria-label="empty"
          onInput={handleListInput}
          className={`list-item-input ${
            checkbox.isCompleted ? "checked-content" : ""
          }`}
          ref={setRefs}
        />
      </div>
    </div>
  );
};

export default memo(ListItem);
