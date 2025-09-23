import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { addLabelAction, removeLabelAction } from "@/utils/actions";
import { createPortal } from "react-dom";
import { Popper } from "@mui/material";
import { v4 as generateUUID } from "uuid";
import handleServerCall from "@/utils/handleServerCall";

const ManageModalLabels = ({
  note,
  isOpen,
  setIsOpen,
  localNote,
  setLocalNote,
  anchorEl,
}) => {
  const { clientID, createLabel, labelsRef, openSnackRef } = useAppContext();
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

    document.addEventListener("click", handler);

    return () => {
      document.removeEventListener("click", handler);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    if (!isOpen) return;

    const labelsMap = new Map(
      localNote?.labels.map((noteLabel) => [noteLabel, true])
    );
    setNoteLabels(labelsMap);
  }, [isOpen, localNote?.labels, isClient]);

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
      setLocalNote((prev) => ({
        ...prev,
        labels: prev.labels.filter((noteLabelUUID) => noteLabelUUID !== uuid),
      }));

      handleServerCall(
        [
          () =>
            removeLabelAction({
              noteUUID: note?.uuid,
              labelUUID: uuid,
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    } else {
      setLocalNote((prev) => ({ ...prev, labels: [...prev.labels, uuid] }));

      handleServerCall(
        [
          () =>
            addLabelAction({
              noteUUID: note?.uuid,
              labelUUID: uuid,
              clientID: clientID,
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

export default memo(ManageModalLabels);
