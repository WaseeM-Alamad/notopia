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
  setOrder,
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
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleMakeCopy = () => {
    const newUUID = generateUUID();
    setNotes((prev) => {
      const newNotes = new Map(prev);
      newNotes.set(newUUID, { ...note, isPinned: false, uuid: newUUID, isArchived: false });
      return newNotes; // Return the updated map
    });
    setOrder((prev) => [newUUID, ...prev]);
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
      isArchived: false,
      isTrash: note.isTrash,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: note.images,
    };
    createNoteAction(newNote).then(()=> window.dispatchEvent(new Event("loadingEnd")));
    
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
            className="menu not-draggable"
          >
            <div className="menu-buttons not-draggable">
              <div
                onClick={handleDelete}
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn not-draggable"
              >
                Delete note
              </div>
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn not-draggable"
              >
                Add label
              </div>
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn not-draggable"
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
