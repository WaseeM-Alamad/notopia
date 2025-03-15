import { copyNoteAction, undoAction } from "@/utils/actions";
import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { v4 as generateUUID } from "uuid";
import ManageLabelsMenu from "./ManageLabelsMenu";

const ModalMenu = ({
  isOpen,
  setIsOpen,
  setLabelsOpen,
  anchorEl,
  note,
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

    const handleResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("click", handler);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("click", handler);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const handleDelete = async (e) => {

  };

  const handleMakeCopy = (e) => {
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
        element.style.transition = "opacity 0.19s ease";
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
        }, 190);
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

  const containerClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

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
            onClick={containerClick}
            initial={{ opacity: 0, transform: "scale(0.97)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: "scale(0.97)" }}
            transition={{
              transform: {
                type: "spring",
                stiffness: 1100,
                damping: 50,
                mass: 1,
              },
              opacity: { duration: 0.15 },
            }}
            style={{
              transformOrigin: "top left",
              width: "fit-content",
              borderRadius: "0.4rem",
              maxWidth: "14.0625rem",
              maxHeight: "26.96125rem",
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
                className="menu-btn n-menu-btn not-draggable"
              >
                Delete note
              </div>
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn n-menu-btn not-draggable"
                onClick={() => {
                  menuRef.current.style.pointerEvents = "none";
                  setLabelsOpen(true);
                  setIsOpen(false);
                }}
              >
                {note.labels.length === 0 ? "Add label" : "Change labels"}
              </div>
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn n-menu-btn not-draggable"
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

export default ModalMenu;
