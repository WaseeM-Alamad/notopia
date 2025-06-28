import { useAppContext } from "@/context/AppContext";
import { useSearch } from "@/context/SearchContext";
import { createLabelForNotesAction } from "@/utils/actions";
import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { v4 as generateUUID } from "uuid";

const ManageTopLabelsMenu = ({
  isOpen,
  dispatchNotes,
  setIsOpen,
  anchorEl,
  selectedNotesIDs,
  setSelectedNotesIDs,
  notes,
  setFadingNotes,
  setVisibleItems,
}) => {
  const { createLabelForNotes, labelsRef, handleLabelsTop, labelObjRef } =
    useAppContext();
  const { filters } = useSearch();
  const [isClient, setIsClient] = useState();
  const [labelSearch, setLabelSearch] = useState("");
  const [notesLabels, setNotesLabels] = useState(new Map());
  const allLabelsMatchSearch = [...labelsRef.current].every(
    ([uuid, labelData]) =>
      labelData.label.toLowerCase() !== labelSearch.toLowerCase()
  );

  const menuRef = useRef(null);
  const labelinputRef = useRef(null);

  const filteredlabel = labelObjRef.current?.uuid || filters.label;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (selectedNotesIDs.length < 1) return;
    const allLabels = [];
    selectedNotesIDs.map(({ uuid }) => {
      const note = notes.get(uuid);
      allLabels.push(...note.labels);
    });

    const labelsMap = new Map();

    allLabels.map((uuid) => {
      labelsMap.set(uuid, labelsMap.has(uuid) ? labelsMap.get(uuid) + 1 : 1);
    });

    setNotesLabels(labelsMap);
  }, [selectedNotesIDs, notes]);

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

  const handleCreateLabel = async () => {
    labelinputRef.current.value = "";
    setLabelSearch("");

    const newUUID = generateUUID();
    const label = labelSearch;
    const notesUUIDs = selectedNotesIDs.map((n) => n.uuid);
    const count = selectedNotesIDs.length;

    const labelObj = {
      uuid: newUUID,
      label: label,
      noteCount: count,
      createdAt: new Date(),
      color: "Default",
    };

    createLabelForNotes({
      labelUUID: newUUID,
      label: label,
      count: count,
    });

    dispatchNotes({
      type: "BATCH_ADD_LABEL",
      selectedNotesIDs: selectedNotesIDs,
      case: "shared",
      uuid: newUUID,
    });

    window.dispatchEvent(new Event("loadingStart"));
    await createLabelForNotesAction({
      labelObj: labelObj,
      notesUUIDs: notesUUIDs,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const addLabel = (uuid) => {
    if (notesLabels.has(uuid)) {
      if (notesLabels.get(uuid) === selectedNotesIDs.length) {
        const notesUUIDs = selectedNotesIDs.map((n) => n.uuid);
        const count = selectedNotesIDs.length;

        const delay = filteredlabel === uuid;

        delay &&
          setFadingNotes((prev) => {
            const updated = new Set(prev);
            notesUUIDs.forEach((uuid) => {
              updated.add(uuid);
            });
            return updated;
          });

        setTimeout(
          () => {
            dispatchNotes({
              type: "BATCH_REMOVE_LABEL",
              selectedNotesIDs: selectedNotesIDs,
              uuid: uuid,
            });
            if (delay) {
              setFadingNotes((prev) => {
                const updated = new Set(prev);
                notesUUIDs.forEach((uuid) => {
                  updated.delete(uuid);
                });
                return updated;
              });
              setVisibleItems((prev) => {
                const updated = new Set(prev);
                notesUUIDs.forEach((uuid) => {
                  updated.delete(uuid);
                });
                return updated;
              });
            }
          },
          delay ? 250 : 0
        );

        delay && setSelectedNotesIDs([]);

        handleLabelsTop({
          operation: "dec",
          case: "shared",
          notesUUIDs: notesUUIDs,
          uuid: uuid,
          count: count,
        });
      } else {
        const notesUUIDs = [];
        const count = selectedNotesIDs.length - notesLabels.get(uuid);
        const updatedNotes = new Map(notes);

        selectedNotesIDs.forEach(({ uuid: noteUUID }) => {
          const note = updatedNotes.get(noteUUID);

          if (!note.labels.includes(uuid)) {
            notesUUIDs.push(noteUUID);
            const updatedLabels = [uuid, ...note.labels];
            updatedNotes.set(noteUUID, { ...note, labels: updatedLabels });
          }
        });

        dispatchNotes({
          type: "BATCH_ADD_LABEL",
          case: "unshared",
          updatedNotes: updatedNotes,
        });

        handleLabelsTop({
          case: "unshared",
          notesUUIDs: notesUUIDs,
          uuid: uuid,
          count: count,
        });
      }
    } else {
      const notesUUIDs = selectedNotesIDs.map((n) => n.uuid);
      const count = selectedNotesIDs.length;

      dispatchNotes({
        type: "BATCH_ADD_LABEL",
        selectedNotesIDs: selectedNotesIDs,
        case: "shared",
        uuid: uuid,
      });

      handleLabelsTop({
        operation: "inc",
        case: "shared",
        notesUUIDs: notesUUIDs,
        uuid: uuid,
        count: count,
      });
    }
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
        addLabel(temp.uuid);
      } else {
        handleCreateLabel();
      }
    }
  };

  const handleLabelInputChange = (e) => {
    setLabelSearch(e.target.value);
  };

  const getSelectionClass = (uuid) => {
    if (notesLabels.has(uuid)) {
      if (notesLabels.get(uuid) === selectedNotesIDs.length) {
        return "checkbox-checked";
      } else {
        return "label-not-shared";
      }
    } else {
      return "";
    }
  };

  const containerClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!isClient) return;

  return (
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
          transformOrigin: "top right",
          paddingBottom: "0",
          zIndex: "311",
          borderRadius: "0.4rem",
          pointerEvents: !isOpen && "none"
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
                      className={`checkbox-unchecked ${getSelectionClass(
                        uuid
                      )}`}
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
              <div className="create-label-box">
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
    </Popper>
  );
};

export default memo(ManageTopLabelsMenu);
