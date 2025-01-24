import { createNoteAction, NoteUpdateAction } from "@/utils/actions";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { v4 as generateUUID } from "uuid";

const MoreMenu = ({
  isOpen,
  setIsOpen,
  menuPosition,
  buttonRef,
  setLocalIsTrash,
  uuid,
  note,
  setNotes,
}) => {
  const [isClient, setIsClient] = useState();
  const menuRef = useRef(null);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !buttonRef?.current?.contains(e.target)
      )
        if (isOpen) {
          setIsOpen(false);
        }
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  }, [isOpen]);

  const handleDelete = async () => {
    setLocalIsTrash(true);
    setIsOpen(false);
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction("isTrash", true, uuid);
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);
  };

  const handleMakeCopy = () => {
    const newUUID = generateUUID();
    setNotes((prevNotes) => [
      { ...note, isPinned: false, uuid: newUUID },
      ...prevNotes,
    ]);
    setTimeout(() => {
      window.dispatchEvent(new Event("closeModal"));
    }, 1);
    window.dispatchEvent(new Event("loadingStart"));
    const newNote = {
      uuid: newUUID,
      title: note.title,
      content: note.content,
      color: note.color,
      labels: note.labels,
      isPinned: false,
      isArchived: note.isArchived,
      isTrash: note.isTrash,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: note.images,
    };
    createNoteAction(newNote);
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);

    setIsOpen(false);
  };

  if (!isClient) return;
  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.15,
            }}
            style={{
              top: `${menuPosition.top + 35}px`,
              left: `${menuPosition.left}px`,
              width: "fit-content",
              borderRadius: "0.4rem",
            }}
            ref={menuRef}
            className="menu"
          >
            <div className="menu-buttons">
              <div
                onClick={handleDelete}
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn"
              >
                Delete note
              </div>
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn"
              >
                Add label
              </div>
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn"
                onClick={handleMakeCopy}
              >
                Make a copy
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.getElementById("moreMenu")
  );
};

export default MoreMenu;
