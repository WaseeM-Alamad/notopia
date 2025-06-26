import React, {
  memo,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import "@/assets/styles/LinearLoader.css";
import NoteTools from "./NoteTools";
import PinIcon from "../icons/PinIcon";
import { NoteUpdateAction, removeLabelAction } from "@/utils/actions";
import Button from "../Tools/Button";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import { useSession } from "next-auth/react";
import CheckMark from "../icons/CheckMark";
import { useAppContext } from "@/context/AppContext";

const Note = memo(
  ({
    note,
    noteActions,
    selectedNotesRef,
    dispatchNotes,
    calculateLayout,
    setSelectedNotesIDs,
    setFadingNotes,
    handleSelectNote,
    setTooltipAnchor,
    openSnackFunction,
    index,
  }) => {
    const { handleLabelNoteCount, labelsRef } = useAppContext();
    const { data: session } = useSession();
    const userID = session?.user?.id;
    const [colorMenuOpen, setColorMenuOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selected, setSelected] = useState(
      selectedNotesRef.current.has(note.uuid)
    );
    const [selectedColor, setSelectedColor] = useState(note.color);
    const uncheckedItems = note?.checkboxes.filter((cb) => !cb.isCompleted);
    const checkedItems = note?.checkboxes.filter((cb) => cb.isCompleted);
    const noteDataRef = useRef(null);
    const inputsRef = useRef(null);
    const imagesRef = useRef(null);
    const titleRef = useRef(null);
    const contentRef = useRef(null);
    const checkRef = useRef(null);

    const handlePinClick = async (e) => {
      closeToolTip();
      handleSelectNote({ clear: true });
      e.stopPropagation(); // Prevent note click event
      if (!note.isArchived) {
        window.dispatchEvent(new Event("loadingStart"));
        dispatchNotes({
          type: "PIN_NOTE",
          note: note,
        });

        try {
          const first = index === 0;
          await NoteUpdateAction({
            type: "isPinned",
            value: !note.isPinned,
            noteUUIDs: [note.uuid],
            first: first,
          });
        } finally {
          window.dispatchEvent(new Event("loadingEnd"));
        }
      } else {
        noteActions({
          type: "PIN_ARCHIVED_NOTE",
          note: note,
          noteRef: note.ref,
          index: index,
        });
      }
    };

    const handleMenuIsOpenChange = useCallback((value) => {
      setColorMenuOpen(value);
    }, []);

    useEffect(() => {
      const handleCloseMenu = () => {
        setSelected(false);
      };

      window.addEventListener("topMenuClose", handleCloseMenu);

      return () => {
        window.removeEventListener("topMenuClose", handleCloseMenu);
      };
    }, []);

    useEffect(() => {
      noteDataRef.current = { ...note, index: index };
    }, [note, index]);

    useEffect(() => {
      const handleSelectAllNotes = () => {
        setSelected(true);
      };

      const handleSelect = (e) => {
        const receivedUUID = e.detail.uuid;
        if (noteDataRef.current.uuid === receivedUUID) {
          setSelected(true);
          handleSelectNote({
            source: "idk",
            e: e,
            selected: selected,
            setSelected: setSelected,
            uuid: noteDataRef.current.uuid,
            index: noteDataRef.current.index,
            isPinned: noteDataRef.current.isPinned,
          });
        }
      };

      const handleDeselect = (e) => {
        const receivedUUID = e.detail.uuid;
        if (note.uuid === receivedUUID) {
          setSelected(false);
          setSelectedNotesIDs((prev) =>
            prev.filter((noteData) => noteData.uuid !== note.uuid)
          );
        }
      };

      window.addEventListener("selectAllNotes", handleSelectAllNotes);
      window.addEventListener("selectNote", handleSelect);
      window.addEventListener("deselectNote", handleDeselect);

      return () => {
        window.removeEventListener("selectAllNotes", handleSelectAllNotes);
        window.removeEventListener("selectNote", handleSelect);
        window.removeEventListener("deselectNote", handleDeselect);
      };
    }, []);

    const handleMouseEnter = (e, text) => {
      const target = e.currentTarget;
      setTooltipAnchor({ anchor: target, text: text, display: true });
    };

    const handleMouseLeave = () => {
      setTooltipAnchor((prev) => ({
        ...prev,
        display: false,
      }));
    };

    const closeToolTip = () => {
      setTooltipAnchor((prev) => ({
        anchor: null,
        text: prev?.text,
      }));
    };

    const handleLabelClick = (e, label) => {
      e.stopPropagation();
      const encodedLabel = encodeURIComponent(label);
      window.location.hash = `label/${encodedLabel.toLowerCase()}`;
    };

    const removeLabel = async (labelUUID) => {
      noteActions({
        type: "REMOVE_LABEL",
        note: note,
        labelUUID: labelUUID,
      });
    };

    const handleCheckboxClick = async (e, checkboxUUID, value) => {
      e.stopPropagation();
      dispatchNotes({
        type: "CHECKBOX_STATE",
        noteUUID: note.uuid,
        checkboxUUID: checkboxUUID,
        value: value,
      });
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "checkboxes",
        operation: "MANAGE_COMPLETED",
        value: value,
        checkboxUUID: checkboxUUID,
        noteUUIDs: [note.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    const handleExpand = async (e) => {
      e.stopPropagation();
      const val = !note?.expandCompleted;
      dispatchNotes({
        type: "EXPAND_ITEMS",
        noteUUID: note.uuid,
      });

      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "expandCompleted",
        value: val,
        noteUUIDs: [note.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    const noteClassName = useMemo(() => {
      return `note ${note.color} n-bg-${note.background}`;
    }, [note.color, note.background, selected]);

    return (
      <>
        <div
          onContextMenu={(e) => {
            e.preventDefault();
            closeToolTip();

            const virtualAnchor = {
              getBoundingClientRect: () =>
                new DOMRect(
                  e.pageX - window.scrollX,
                  e.pageY - window.scrollY,
                  0,
                  0
                ),
              contextElement: document.body,
            };

            setAnchorEl(virtualAnchor);
            setMoreMenuOpen((prev) => !prev);
          }}
          className="note-wrapper"
          ref={note.ref}
        >
          {/* <button onClick={()=> console.log(note.images)}>click</button> */}
          <span
            style={{
              opacity: (selected || colorMenuOpen || moreMenuOpen) && "1",
            }}
            ref={checkRef}
            className="checkmark"
            onClick={(e) =>
              handleSelectNote({
                source: "checkmark",
                e: e,
                selected: selected,
                setSelected: setSelected,
                uuid: note.uuid,
                index: index,
                isPinned: note.isPinned,
              })
            }
            onMouseEnter={(e) =>
              handleMouseEnter(
                e,
                `${selected ? "Deselect note" : "Select note"}`
              )
            }
            onMouseLeave={handleMouseLeave}
          >
            <CheckMark
              color={selected ? "note-checkmark-selected" : note.color}
              size="23"
            />
          </span>
          <div
            style={{
              paddingBottom:
                note.images.length === 0 ||
                note.labels.length !== 0 ||
                note.title ||
                note.content ||
                !(note.checkboxes.length === 0 || !note.showCheckboxes)
                  ? "45px"
                  : "0px  ",
            }}
            className={noteClassName}
            onClick={(e) =>
              handleSelectNote({
                source: "note",
                e: e,
                selected: selected,
                setSelected: setSelected,
                uuid: note.uuid,
                index: index,
                isPinned: note.isPinned,
              })
            }
          >
            <div>
              <div>
                <div
                  style={{
                    position:
                      (note.images.length > 0 ||
                        (note.checkboxes.length > 0 &&
                          !note.title.trim() &&
                          !note.content.trim())) &&
                      "absolute",
                  }}
                  className="corner"
                />
                <div
                  style={{
                    opacity: colorMenuOpen ? "1" : undefined,
                    opacity: (colorMenuOpen || moreMenuOpen) && "1",
                  }}
                  className="pin"
                  tabIndex="0"
                >
                  {!note.isTrash && (
                    <Button
                      onMouseEnter={(e) =>
                        handleMouseEnter(
                          e,
                          `${note.isPinned ? "Unpin" : "Pin"}`
                        )
                      }
                      onMouseLeave={handleMouseLeave}
                      onClick={handlePinClick}
                      tabIndex="-1"
                    >
                      <PinIcon
                        isPinned={note.isPinned}
                        rotation={note.isPinned ? "-45deg" : "-5deg"}
                      />
                    </Button>
                  )}
                </div>
                <div
                  style={{
                    position: "relative",
                    // opacity: isLoading && note.images.length > 0 ? "0.6" : "1",
                    transition: "all 0.2s ease",
                  }}
                  ref={imagesRef}
                >
                  <NoteImagesLayout
                    images={note.images}
                    calculateMasonryLayout={calculateLayout}
                  />
                  {false && note.images.length > 0 && (
                    <div className="linear-loader" />
                  )}
                </div>

                {note.images.length === 0 &&
                  note.labels.length === 0 &&
                  !note.title?.trim() &&
                  !note.content?.trim() &&
                  (note.checkboxes.length === 0 || !note.showCheckboxes) && (
                    <div className="empty-note" aria-label="Empty note" />
                  )}
                <div ref={inputsRef}>
                  {note.title?.trim() && (
                    <div dir="auto" ref={titleRef} className="title">
                      {note.title}
                    </div>
                  )}
                  {note.content?.trim() && (
                    <div dir="auto" ref={contentRef} className="content">
                      {note.content}
                    </div>
                  )}
                </div>

                {note.checkboxes.length > 0 && note.showCheckboxes && (
                  <div
                    style={{
                      paddingTop: !note.content.trim() && "0.625rem",
                      paddingBottom: "0.4rem",
                    }}
                  >
                    {uncheckedItems.map((checkbox, index) => {
                      return (
                        <div
                          key={checkbox.uuid}
                          className="checkbox-wrapper note-checkbox-wrapper"
                          style={{
                            wordBreak: "break-all",
                            paddingLeft: checkbox.parent ? "1.8rem" : "0.7rem",
                            paddingRight:
                              !note.content.trim() &&
                              !note.title.trim() &&
                              index === 0 &&
                              "2.5rem",
                          }}
                        >
                          <div
                            onClick={(e) =>
                              handleCheckboxClick(
                                e,
                                checkbox.uuid,
                                !checkbox.isCompleted
                              )
                            }
                            className={`note-checkbox checkbox-unchecked ${
                              checkbox.isCompleted ? "checkbox-checked" : ""
                            }`}
                          />
                          <div
                            style={{
                              width: "100%",
                              paddingLeft: "0.5rem",
                              fontSize: ".875rem",
                            }}
                            className={
                              checkbox.isCompleted ? "checked-content" : ""
                            }
                          >
                            {checkbox.content}
                          </div>
                        </div>
                      );
                    })}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {checkedItems.length > 0 && uncheckedItems.length > 0 && (
                        <div
                          onClick={handleExpand}
                          className="checkboxes-divider"
                          style={{ cursor: "pointer" }}
                        />
                      )}
                    </div>

                    {checkedItems.length > 0 && !note.expandCompleted && (
                      <div
                        className="completed-items completed-items-note"
                        aria-label={`${checkedItems.length} Completed item${
                          checkedItems.length === 1 ? "" : "s"
                        }`}
                      />
                    )}

                    {note.expandCompleted &&
                      checkedItems.map((checkbox) => {
                        return (
                          <div
                            key={checkbox.uuid}
                            className="checkbox-wrapper note-checkbox-wrapper"
                            style={{
                              wordBreak: "break-all",
                              paddingLeft: "0.7rem",
                            }}
                          >
                            <div
                              onClick={(e) =>
                                handleCheckboxClick(
                                  e,
                                  checkbox.uuid,
                                  !checkbox.isCompleted
                                )
                              }
                              className={`note-checkbox checkbox-unchecked ${
                                checkbox.isCompleted ? "checkbox-checked" : ""
                              }`}
                            />
                            <div
                              style={{
                                width: "100%",
                                paddingLeft: "0.5rem",
                                fontSize: ".875rem",
                              }}
                              className={
                                checkbox.isCompleted ? "checked-content" : ""
                              }
                            >
                              {checkbox.content}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
                {note.labels.length !== 0 && (
                  <>
                    <div className="note-labels-container">
                      {note.labels
                        .sort((a, b) => {
                          const labelsMap = labelsRef.current;
                          const labelA = labelsMap.get(a)?.label || "";
                          const labelB = labelsMap.get(b)?.label || "";
                          return labelA.localeCompare(labelB);
                        })
                        .map((labelUUID, index) => {
                          if (index + 1 >= 3 && note.labels.length > 3) return;
                          const label = labelsRef.current.get(labelUUID)?.label;
                          return (
                            <div
                              onClick={(e) => handleLabelClick(e, label)}
                              key={labelUUID}
                              className={[
                                "label-wrapper",
                                !note.isTrash && "label-wrapper-h",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <label className="note-label">{label}</label>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  closeToolTip();
                                  removeLabel(labelUUID);
                                }}
                                onMouseEnter={(e) =>
                                  handleMouseEnter(e, "Remove label")
                                }
                                onMouseLeave={handleMouseLeave}
                                className="remove-label"
                              />
                            </div>
                          );
                        })}
                      {note.labels.length > 3 && (
                        <div className="more-labels">
                          <label className="more-labels-label">
                            +{note.labels.length - 2}
                          </label>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <NoteTools
            colorMenuOpen={colorMenuOpen}
            setColorMenuOpen={handleMenuIsOpenChange}
            setTooltipAnchor={setTooltipAnchor}
            moreMenuOpen={moreMenuOpen}
            setFadingNotes={setFadingNotes}
            anchorEl={anchorEl}
            setAnchorEl={setAnchorEl}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            setMoreMenuOpen={setMoreMenuOpen}
            note={note}
            dispatchNotes={dispatchNotes}
            userID={userID}
            openSnackFunction={openSnackFunction}
            noteActions={noteActions}
            index={index}
          />
          <div
            className={`note-border ${
              selected
                ? "element-selected"
                : note.color === "Default"
                ? "default-border"
                : "transparent-border"
            }`}
            style={{ opacity: selected ? "1" : "0" }}
          />
        </div>
      </>
    );
  }
);

Note.displayName = "Note";

export default Note;
