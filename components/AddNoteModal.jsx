import React, { useState, useEffect, useRef } from "react";
import "@/assets/styles/modal.css";
import { createPortal } from "react-dom";
import { useAppContext } from "@/context/AppContext";
import { createNoteAction } from "@/utils/actions";
import { v4 as uuid } from "uuid";
import ModalTools from "./ModalTools";

const AddNoteModal = ({ trigger, setTrigger, setNotes, lastAddedNoteRef }) => {
  const [note, setNote] = useState({
    uuid: "",
    title: "",
    content: "",
    color: "#FFFFFF",
    labels: [],
    isPinned: false,
    isArchived: false,
    isTrash: false,
    images: [],
  });
  const { modalPosition, setModalPosition } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [trigger2, setTrigger2] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const modalRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const modalContainerRef = useRef(null);

  useEffect(() => {
    // Set isClient to true once the component is mounted on the client side
    setIsClient(true);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setTrigger2(trigger);
    }, 10);
  }, [trigger]);

  useEffect(() => {
    if (trigger2) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`; // Add padding
    } else {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = ""; // Remove padding
    }
    return () => (document.body.style.overflow = "auto"); // Cleanup
  }, [trigger2]);

  if (!isClient) {
    return null; // Return nothing on the server side
  }

  const handleClose = async (e) => {
    if (modalContainerRef.current === e.target) {
      setTrigger2(false);
      setTimeout(() => {
        setTrigger(false);
      }, 200);

      if (note.title.trim() || note.content.trim()) {
        try {
          setTimeout(() => {
            const rect = lastAddedNoteRef.current.getBoundingClientRect();
            setModalPosition({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              borderRadius: "0.7rem",
            });
          }, 20);
        } catch (error) {
          console.log("Couldn't fetch note position on add.");
        }

        const newNote = {
          uuid: uuid(),
          title: note.title,
          content: note.content,
          color: note.color,
          labels: note.labels,
          isPinned: note.isPinned,
          isArchived: note.isArchived,
          isTrash: note.isArchived,
          images: note.images,
        };
        setNotes((prev) => [newNote, ...prev]);
        window.dispatchEvent(new Event("loadingStart"));
        await createNoteAction(newNote);
        setTimeout(() => {
          window.dispatchEvent(new Event("loadingEnd"));
        }, 800);
      }
      titleRef.current.textContent = "";
      contentRef.current.textContent = "";
      setSelectedColor("#FFFFFF");
      setNote({
        uuid: "",
        title: "",
        content: "",
        color: "#FFFFFF",
        labels: [],
        isPinned: false,
        isArchived: false,
        isTrash: false,
        images: [],
      });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const handleTitleInput = (e) => {
    const text = e.target.textContent;
    setNote({ ...note, title: text });
    if (!text) {
      e.target.textContent = "";
    }
  };

  const handleContentInput = (e) => {
    const text = e.target.textContent;
    setNote({ ...note, content: text });
    if (!text) {
      e.target.textContent = "";
    }
  };

  return createPortal(
    <div
      ref={modalContainerRef}
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
          opacity: trigger2 ? "1" : "0",
          top: trigger2 ? "30%" : `${modalPosition.top}px`,
          left: trigger2 ? "50%" : `${modalPosition.left}px`,
          width: trigger2 ? "600px" : `${modalPosition.width}px`,
          height: trigger2 ? "" : `${modalPosition.height}px`,
          minHeight: trigger2 ? "185px" : "",
          transform: trigger2 && "translate(-50%, -30%)",
          borderRadius: trigger2 ? "0.7rem" : modalPosition.borderRadius,
          backgroundColor: selectedColor,
          transition:
            "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), height 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.25s linear, borderRadius 0.1s",
        }}
        className="modal"
      >
        <div className="modal-inputs-container">
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
            className="modal-title-input modal-editable-title"
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
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            onPaste={handlePaste}
            ref={contentRef}
            className="modal-content-input modal-editable-content"
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label="Take a note...."
            spellCheck="false"
          />
        </div>
        { trigger2 &&
        <ModalTools
          setNote={setNote}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
        />}
      </div>
    </div>,
    document.getElementById("modal-portal")
  );
};

export default AddNoteModal;
