import { useAppContext } from "@/context/AppContext";
import {
  addLabelAction,
  copyNoteAction,
  NoteUpdateAction,
  undoAction,
  removeLabelAction,
} from "@/utils/actions";
import { Popper } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { v4 as generateUUID } from "uuid";

const MoreMenu = ({
  isOpen,
  setIsOpen,
  anchorEl,
  noteRef,
  note,
  index,
  dispatchNotes,
  openSnackFunction,
  noteActions,
}) => {
  const { createLabel, handleLabelNoteCount, labelsRef } = useAppContext();
  const [isClient, setIsClient] = useState();
  const [labelsOpen, setLabelsOpen] = useState(false);
  // const labelInputRef = useRef(null);
  const [labelSearch, setLabelSearch] = useState("");
  const [noteLabels, setNoteLabels] = useState(new Map());
  const allLabelsMatchSearch = [...labelsRef.current].every(
    ([uuid, labelData]) =>
      labelData.label.toLowerCase() !== labelSearch.toLowerCase()
  );

  const menuRef = useRef(null);
  const labelinputRef = useRef(null);
  const isFirstRunRef = useRef(true);

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

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    if (!labelsOpen) return;

    const labelsMap = new Map(
      note.labels.map((noteLabel) => [noteLabel, true])
    );
    setNoteLabels(labelsMap);
  }, [labelsOpen, note.labels]);

  const handleDelete = async (e) => {
    noteActions({
      type: "RESTORE_NOTE",
      note: note,
      index: index,
      noteRef: noteRef, 
      setIsOpen: setIsOpen,
    })
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

  const handleInputKeyDown = (e) => {
    let temp;
    if (e.key === "Enter") {
      e.preventDefault();

      if (
        ![...labelsRef.current].every(([uuid, labelData]) => {
          const label = labelData.label;
          temp = { uuid, label };
          return labelData.label.toLowerCase() !== labelSearch.toLowerCase();
        })
      ) {
        addLabel(temp.uuid, temp.label);
      } else {
        handleCreateLabel();
      }
    }
  };

  const handleCreateLabel = () => {
    const newUUID = generateUUID();
    const label = labelSearch;
    const createdAt = new Date();
    createLabel(newUUID, label, createdAt);
    labelinputRef.current.value = "";
    setLabelSearch("");
    addLabel(newUUID, label);
  };

  const addLabel = async (uuid, label) => {
    if (noteLabels.has(uuid)) {
      dispatchNotes({
        type: "REMOVE_LABEL",
        note: note,
        labelUUID: uuid,
      });
      handleLabelNoteCount(uuid, "decrement");

      window.dispatchEvent(new Event("loadingStart"));
      await removeLabelAction({
        noteUUID: note.uuid,
        labelUUID: uuid,
      });
      window.dispatchEvent(new Event("loadingEnd"));
    } else {
      dispatchNotes({
        type: "ADD_LABEL",
        note: note,
        labelUUID: uuid,
      });
      handleLabelNoteCount(uuid);

      window.dispatchEvent(new Event("loadingStart"));
      await addLabelAction({
        noteUUID: note.uuid,
        labelUUID: uuid,
      });
      window.dispatchEvent(new Event("loadingEnd"));
    }
  };

  const handleLabelInputChange = (e) => {
    setLabelSearch(e.target.value);
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
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.05,
            }}
            style={{
              width: "fit-content",
              borderRadius: "0.4rem",
              maxWidth: "14.0625rem",
              maxHeight: "26.96125rem",
              paddingBottom: labelsOpen && "0",
              paddingTop: labelsOpen && "1rem",
            }}
            ref={menuRef}
            className="menu not-draggable"
          >
            {!labelsOpen ? (
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
                  onClick={() => setLabelsOpen(true)}
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
            ) : (
              <motion.div
                // initial={{ y: 2, opacity: 0 }}
                // animate={{ y: 0, opacity: 1 }}
                // transition={{
                //   y: { type: "spring", stiffness: 1000, damping: 50, mass: 1 },
                //   opacity: { duration: 0.2 },
                // }}
                style={{ width: "14.0625rem" }}
              >
                <div
                  style={{
                    padding: "0 0.8rem",
                    fontSize: "0.9rem",
                    color: "rgb(32,33,36)",
                    boxSizing: "border-box",
                  }}
                >
                  Label note
                </div>
                <div
                  style={{
                    padding: "0.55rem 0.8rem 0.8rem 0.8rem",
                    fontSize: "0.9rem",
                    position: "relative",
                    boxSizing: "border-box",
                  }}
                >
                  <div className="search-icon" />
                  <input
                    ref={labelinputRef}
                    onKeyDown={handleInputKeyDown}
                    onChange={handleLabelInputChange}
                    className="label-input"
                    type="text"
                    maxLength="50"
                    placeholder="Enter label name"
                  />
                </div>
                <div
                  className="label-items-container"
                  style={{ paddingBottom: "6px" }}
                >
                  {/* style={{paddingBottom: "0.55rem"}} */}
                  {[...labelsRef.current]
                    .reverse()
                    .map(([uuid, labelData], index) => {
                      if (
                        !labelData.label
                          .toLowerCase()
                          .includes(labelSearch.toLowerCase())
                      )
                        return;
                      return (
                        <div
                          key={index}
                          onClick={() => addLabel(uuid, labelData.label)}
                          className="label-item"
                          style={{
                            wordBreak: "break-all",
                          }}
                        >
                          <div
                            className="label-checkmark"
                            style={{
                              backgroundImage:
                                noteLabels.has(uuid) &&
                                "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMDAwIj48cGF0aCBkPSJNMTkgM0g1Yy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yVjVjMC0xLjEtLjktMi0yLTJ6bTAgMTZINVY1aDE0djE0eiIvPgogIDxwYXRoIGQ9Ik0xOCA5bC0xLjQtMS40LTYuNiA2LjYtMi42LTIuNkw2IDEzbDQgNHoiLz4KPC9zdmc+Cg==)",
                            }}
                          />
                          <div style={{ width: "100%", paddingLeft: "0.5rem" }}>
                            {labelData.label}
                          </div>
                        </div>
                      );
                    })}
                </div>
                {labelSearch && allLabelsMatchSearch && (
                  <div onClick={handleCreateLabel} className="create-label">
                    <div
                      className="create-icon"
                      // style={{ position: "absolute", bottom: "1px" }}
                    />
                    <div
                      style={{
                        display: "inline-block",
                        paddingTop: "1px",
                        paddingLeft: "0.2rem",
                        fontSize: "13px",
                        color: "rgb(32,33,36)",
                        cursor: "pointer",
                      }}
                    >
                      Create
                      <span
                        style={{
                          color: "#00000",
                          fontWeight: "bold",
                          wordBreak: "break-all",
                        }}
                      >
                        {` "${labelSearch}"`}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </Popper>
    </>,
    document.getElementById("moreMenu")
  );
};

export default MoreMenu;
