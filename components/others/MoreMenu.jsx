import { copyNoteAction, NoteUpdateAction, undoAction } from "@/utils/actions";
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
  index,
  dispatchNotes,
  openSnackFunction,
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
    const initialIndex = index;
    const undoTrash = async () => {
      dispatchNotes({
        type: "UNDO_TRASH",
        note: note,
        initialIndex: initialIndex,
      });
      setTimeout(() => {
        window.dispatchEvent(new Event("closeModal"));
      }, 0);
    };

    const onClose = async () => {
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction("isTrash", true, uuid);
      window.dispatchEvent(new Event("loadingEnd"));
    };

    if (!note.isTrash) {
      openSnackFunction({
        snackMessage: `${
          note.isPinned ? "Note unpinned and trashed" : "Note trashed"
        }`,
        snackOnUndo: undoTrash,
        snackOnClose: onClose,
        unloadWarn: true,
      });
    }
    setLocalIsTrash(true);
    setIsOpen(false);
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
      const element = document.querySelector('[data-position="0"]');

      const undoCopy = async () => {
        element.style.transition = "opacity 0.17s ease";
        element.style.opacity = "0";
        setTimeout(async () => {
          dispatchNotes({
            type: "UNDO_COPY",
            noteUUID: newNote.uuid,
          });
          window.dispatchEvent(new Event("loadingStart"));
          await undoAction({
            type: "UNDO_COPY",
            noteUUID: newNote.uuid,
            isImages: note.images.length,
          });
          window.dispatchEvent(new Event("loadingEnd"));
        }, 170);
      };
      openSnackFunction({
        snackMessage: "Note created",
        snackOnUndo: undoCopy,
      });
    }, 5);

    setTimeout(() => {
      window.dispatchEvent(new Event("closeModal"));
    }, 1);
    window.dispatchEvent(new Event("loadingStart"));

    copyNoteAction(newNote, note.uuid).then(() =>
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
