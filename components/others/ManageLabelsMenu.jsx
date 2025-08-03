import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { addLabelAction, removeLabelAction } from "@/utils/actions";
import { createPortal } from "react-dom";
import { Popper } from "@mui/material";
import { v4 as generateUUID } from "uuid";
import { useSearch } from "@/context/SearchContext";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";

const ManageLabelsMenu = ({
  dispatchNotes,
  note,
  isOpen,
  setIsOpen,
  anchorEl,
  removedFilteredLabelRef,
}) => {
  const {
    createLabel,
    labelsRef,
    labelObjRef,
    openSnackRef,
    notesStateRef,
    user,
  } = useAppContext();
  const { filters } = useSearch();
  const userID = user?.id;
  const [isClient, setIsClient] = useState();
  const [labelSearch, setLabelSearch] = useState("");
  const [noteLabels, setNoteLabels] = useState(new Set());
  const allLabelsMatchSearch = [...labelsRef.current].every(
    ([uuid, labelData]) =>
      labelData.label.toLowerCase() !== labelSearch.toLowerCase()
  );
  const menuRef = useRef(null);
  const isFirstRunRef = useRef(true);
  const labelinputRef = useRef(null);

  const filteredlabel = labelObjRef.current?.uuid || filters.label;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handler);
    document.addEventListener("contextmenu", handler);

    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("contextmenu", handler);
    };
  }, [isOpen]);

  useEffect(() => {
    // if (isFirstRunRef.current) {
    // isFirstRunRef.current = false;
    // return;
    // }
    if (!isOpen) return;

    setNoteLabels(new Set(note.labels));
  }, []);

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
        addLabel(temp.uuid);
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
    addLabel(newUUID);
  };

  const addLabel = async (uuid) => {
    if (noteLabels.has(uuid)) {
      setNoteLabels((prev) => {
        const updated = new Set(prev);
        updated.delete(uuid);
        return updated;
      });
      if (filteredlabel !== uuid) {
        dispatchNotes({
          type: "REMOVE_LABEL",
          note: note,
          labelUUID: uuid,
        });
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "REMOVE_LABEL",
          note: note,
          labelUUID: uuid,
        });
      } else {
        removedFilteredLabelRef.current = uuid;
      }

      handleServerCall(
        [
          () =>
            removeLabelAction({
              noteUUID: note.uuid,
              labelUUID: uuid,
            }),
        ],
        openSnackRef.current
      );
    } else {
      setNoteLabels((prev) => {
        const updated = new Set(prev);
        updated.add(uuid);
        return updated;
      });
      if (filteredlabel !== uuid) {
        dispatchNotes({
          type: "ADD_LABEL",
          note: note,
          labelUUID: uuid,
        });
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "ADD_LABEL",
          note: note,
          labelUUID: uuid,
        });
      } else {
        removedFilteredLabelRef.current = null;
      }

      handleServerCall(
        [
          () =>
            addLabelAction({
              noteUUID: note.uuid,
              labelUUID: uuid,
            }),
        ],
        openSnackRef.current
      );
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
      <motion.div
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
        ref={menuRef}
        onClick={containerClick}
        style={{
          transformOrigin: "top left",
          paddingBottom: "0",
          zIndex: "311",
          borderRadius: "0.4rem",
          pointerEvents: !isOpen && "none",
        }}
        className="menu not-draggable"
      >
        <div style={{ width: "14.0625rem" }}>
          <div className="label-note">Label note</div>
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
                    onClick={() => addLabel(uuid)}
                    className="checkbox-wrapper"
                    style={{
                      wordBreak: "break-all",
                    }}
                  >
                    <div
                      className={`checkbox-unchecked ${
                        noteLabels.has(uuid) && "checkbox-checked"
                      }`}
                    />
                    <div
                      dir="auto"
                      style={{ width: "100%", paddingLeft: "0.5rem" }}
                    >
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
              <div className="create-label-box">
                Create
                <span
                  dir="auto"
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
        </div>
      </motion.div>
    </Popper>,
    document.getElementById("menu")
  );
};

export default memo(ManageLabelsMenu);
