import { createNoteAction, NoteUpdateAction } from "@/utils/actions";
import { Popper } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { v4 as generateUUID } from "uuid";

const MoreMenu = ({
  isOpen,
  setIsOpen,
  anchorEl,
  setLocalIsTrash,
  uuid,
  note,
  dispatchNotes,
}) => {
  const [isClient, setIsClient] = useState();
  const menuRef = useRef(null);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target) && !anchorEl.contains(e.target))
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

    dispatchNotes({
      type: "ADD_NOTE",
      newNote: newNote,
    });
    setTimeout(() => {
      window.dispatchEvent(new Event("closeModal"));
    }, 1);
    window.dispatchEvent(new Event("loadingStart"));

    createNoteAction(newNote).then(() =>
      window.dispatchEvent(new Event("loadingEnd"))
    );

    setIsOpen(false);
  };

  if (!isClient) return;
  return createPortal(
    <>
      <Popper
        open={isOpen}
        anchorEl={anchorEl}
        style={{ zIndex: "999" }}
        placement="bottom-start"
        modifiers={[
          {
            name: "preventOverflow",
            options: {
              boundariesElement: "window",
            },
          },
        ]}
      >
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.15,
            }}
            style={{
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
      </Popper>
    </>,
    document.getElementById("moreMenu")
  );
};

export default MoreMenu;
