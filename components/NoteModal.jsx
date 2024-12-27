import React, { useCallback, useEffect, useRef, useState } from "react";
import "@/assets/styles/modal.css";
import { createPortal } from "react-dom";
import Button from "./Tools/Button";
import PinIcon from "./icons/PinIcon";
import NoteImagesLayout from "./Tools/NoteImagesLayout";
import { NoteTextUpdateAction } from "@/utils/actions";
import { debounce } from "lodash";

const NoteModal = ({
  trigger,
  setTrigger,
  trigger2,
  setTrigger2,
  notePos,
  note,
  setNote,
  calculateLayout,
}) => {
  const modalRef = useRef(null);
  const [width, setWidth] = useState(5);
  const [modalNote, setModalNote] = useState(note);
  const [isClient, setIsClient] = useState(false);
  const titleRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    // Set isClient to true once the component is mounted on the client side
    setIsClient(true);
  }, []);

  const handleClose = (e) => {
    if (!modalRef.current.contains(e.target)) {
      setTrigger2(false);
      setTimeout(() => {
        setTrigger(false);
      }, 250);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setTrigger2(trigger);
    }, 10);
    if (trigger) {
      if (contentRef.current) contentRef.current.textContent = note.content;
      if (titleRef.current) titleRef.current.textContent = note.title;
    } else {
      calculateLayout();
    }
  }, [trigger]);

  useEffect(() => {
    if (trigger2) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      modalRef.current.style.marginLeft = `${0}px`;
      //marginLeft: trigger2? '0px': "5px",
    } else {
      setNote(modalNote);
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = ""; // Remove padding
      if (modalRef.current)
        modalRef.current.style.marginLeft = `${
          scrollbarWidth === 0 ? 0 : scrollbarWidth - 5
        }px`;
    }
    return () => (document.body.style.overflow = "auto"); // Cleanup
  }, [trigger2]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (modalRef.current) {
        setTimeout(() => {
          // console.log("Element width:", modalRef.current.offsetWidth); // Check the computed width
          setWidth(modalRef.current.offsetWidth);
        }, 0);
      }
    });

    if (modalRef.current) {
      observer.observe(modalRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [trigger]);

  const updateTextDebounced = useCallback(
    debounce(async (values) => {
      window.dispatchEvent(new Event("loadingStart"));
      await NoteTextUpdateAction(values, note.uuid);
      setTimeout(() => {
        window.dispatchEvent(new Event("loadingEnd"));
      }, 800);
    }, 600),
    [] // Dependencies array, make sure it's updated when `note.uuid` changes
  );

  if (!isClient) {
    return null; // Return nothing on the server side
  }

  const handlePinClick = () => {};

  const handleTitleInput = (e) => {
    const text = e.target.textContent.trim();
    setModalNote((prev) => ({ ...prev, title: text }));
    updateTextDebounced({ title: text, content: modalNote.content });

    if (!text) {
      e.target.textContent = "";
    }
  };

  const handleContentInput = (e) => {
    const text = e.target.textContent.trim();
    setModalNote((prev) => ({ ...prev, content: text }));
    updateTextDebounced({ title: modalNote.title, content: text });

    if (!text) {
      e.target.textContent = "";
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  return createPortal(
    <>
      <div
        onClick={handleClose}
        style={{
          display: trigger ? "" : "none",
          backgroundColor: trigger2 && "rgba(0,0,0,0.5)",
        }}
        className="modal-container"
      >
        <div
          ref={modalRef}
          style={{
            top: trigger2 ? "30%" : `${notePos.top}px`,
            left: trigger2 ? "50%" : `${notePos.left}px`,
            width: trigger2 ? "600px" : `${notePos.width}px`,
            height: trigger2 ? "" : `${notePos.height}px`,
            minHeight: trigger2 ? "185px" : "",
            transform: trigger2 && "translate(-50%, -30%)",
            borderRadius: "0.7rem",
            backgroundColor: note.color,
            transition:
              "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.25s linear",
          }}
          className="modal"
        >
          <div
            style={{ overflowY: trigger2 ? "auto" : "hidden" }}
            className="modal-inputs-container"
          >
            {note.images.length === 0 && <div className="modal-corner" />}
            <div className="modal-pin">
              <Button
                disabled={!trigger2}
                style={{ opacity: !trigger2 && "0" }}
                onClick={handlePinClick}
              >
                <PinIcon
                  color={note.isPinned ? "#212121" : "transparent"}
                  opacity={0.8}
                  rotation={note.isPinned ? "0deg" : "40deg"}
                />
              </Button>
            </div>
            <NoteImagesLayout width={width} images={modalNote.images} />
            {!trigger2 &&
              modalNote.images.length === 0 &&
              !modalNote.title &&
              !modalNote.content && (
                <div className="empty-note" aria-label="Empty note" />
              )}
            <div
              style={{
                display: trigger2
                  ? ""
                  : note.content && !note.title
                  ? "none"
                  : !note.title && !note.content
                  ? "none"
                  : "",
              }}
              contentEditable
              suppressContentEditableWarning
              onInput={handleTitleInput}
              onPaste={handlePaste}
              ref={titleRef}
              className={`${
                trigger2 ? "modal-title-input" : "modal-closed-title-input"
              } modal-editable-title`}
              role="textbox"
              tabIndex="0"
              aria-multiline="true"
              aria-label="Title"
              spellCheck="false"
            />
            <div
              style={{
                display: trigger2
                  ? ""
                  : !note.content && note.title
                  ? "none"
                  : !note.title && !note.content
                  ? "none"
                  : "",
                minHeight: "3.8rem",
                transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
              }}
              contentEditable
              suppressContentEditableWarning
              onInput={handleContentInput}
              onPaste={handlePaste}
              ref={contentRef}
              className={`${
                trigger2 ? "modal-content-input" : "modal-closed-content-input"
              } modal-editable-content`}
              role="textbox"
              tabIndex="0"
              aria-multiline="true"
              aria-label="Take a note...."
              spellCheck="false"
            />
          </div>
          {/* {trigger2 && (
            <ModalTools
              setNote={setNote}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              handleClose={handleClose}
            />
          )} */}
        </div>
      </div>
    </>,
    document.getElementById("modal-portal")
  );
};

export default NoteModal;
