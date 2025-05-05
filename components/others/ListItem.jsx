import React, { useEffect, useRef } from "react";
import Button from "../Tools/Button";
import { NoteUpdateAction } from "@/utils/actions";

const ListItem = ({
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
    }));
    updateListItemContent(t, checkbox.uuid);

    if (text === "\n") {
      e.target.innerText = "";
    }
  };

  const handleDelete = async () => {
    setLocalNote((prev) => ({
      ...prev,
      checkboxes: prev.checkboxes.filter((cb) => cb.uuid !== checkbox.uuid),
    }));
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction({
      type: "checkboxes",
      operation: "DELETE_CHECKBOX",
      checkboxUUID: checkbox.uuid,
      noteUUIDs: [noteUUID],
    });
    window.dispatchEvent(new Event("loadingEnd"));
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
        handleDragStart(e, targetElement, index);
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
    overIndexRef.current = index;
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      key={checkbox.uuid}
      ref={(el) => {
        if (checkbox.isCompleted) {
          return;
        } else {
          itemRefs.current[index] = el;
        }
      }}
      className={`checkbox-wrapper note-checkbox-wrapper`}
      style={{
        wordBreak: "break-all",
        padding: "0.4rem 0.8rem 0.4rem 1.7rem",
        lineHeight: "1.3rem",
      }}
    >
      {!checkbox.isCompleted && (
        <div onMouseDown={handleMouseDown} className="drag-db-area" />
      )}
      <Button onClick={handleDelete} className="delete-list-item" />
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
        contentEditable
        spellCheck="false"
        style={{
          width: "100%",
          paddingLeft: "0.5rem",
          fontSize: "1rem",
        }}
        onPaste={handlePaste}
        onInput={handleListInput}
        className={`list-item-input ${
          checkbox.isCompleted ? "checked-content" : ""
        }`}
        ref={setRefs}
      />
    </div>
  );
};

export default ListItem;
