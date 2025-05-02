import React, { useEffect, useRef } from "react";
import Button from "../Tools/Button";

const ListItem = ({
  handleCheckboxClick,
  updateListItemContent,
  checkbox,
  lastListItemRef,
  setLocalNote,
  modalOpen,
  index,
}) => {
  const listRef = useRef(null);
  const inputTimeoutRef = useRef(null);

  const setRefs = (element) => {
    listRef.current = element;
    if (lastListItemRef) lastListItemRef.current = element;
  };

  useEffect(() => {
    if (!modalOpen && inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
      const text = listRef.current.innerText;
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
    if (!listRef.current) return;

    console.log("hihi");

    listRef.current.innerText = checkbox.content;
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

  return (
    <div
      key={checkbox.uuid}
      className="checkbox-wrapper note-checkbox-wrapper"
      style={{
        wordBreak: "break-all",
        paddingLeft: "1.7rem",
      }}
    >
      <div className="drag-db-area" />
      <Button className="delete-list-item" />
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
