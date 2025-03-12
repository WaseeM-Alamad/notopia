import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { addLabelAction, removeLabelAction } from "@/utils/actions";
import { createPortal } from "react-dom";
import { Popper } from "@mui/material";

const ManageLabelsMenu = ({
  dispatchNotes,
  note,
  isOpen,
  setIsOpen,
  noteRef,
  labelMenuPos,
  anchorEl,
}) => {
  const { createLabel, handleLabelNoteCount, labelsRef } = useAppContext();
  const [isClient, setIsClient] = useState();
  const [labelSearch, setLabelSearch] = useState("");
  const [noteLabels, setNoteLabels] = useState(new Map());
  const allLabelsMatchSearch = [...labelsRef.current].every(
    ([uuid, labelData]) =>
      labelData.label.toLowerCase() !== labelSearch.toLowerCase()
  );
  const menuRef = useRef(null);
  const isFirstRunRef = useRef(true);
  const labelinputRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target))
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

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    if (!isOpen) return;

    const labelsMap = new Map(
      note.labels.map((noteLabel) => [noteLabel, true])
    );
    setNoteLabels(labelsMap);
  }, [isOpen, note.labels, isClient]);

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
        }}
        className="menu not-draggable"
      >
        <div style={{ width: "14.0625rem" }}>
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
        </div>
      </motion.div>
    </Popper>,
    document.getElementById("moreMenu")
  );
};

export default ManageLabelsMenu;
