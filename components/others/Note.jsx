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
import ImageDropZone from "../Tools/ImageDropZone";
import { AnimatePresence } from "framer-motion";
import { useLastInputWasKeyboard } from "@/hooks/useLastInputWasKeyboard";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import { useSearch } from "@/context/SearchContext";
import NoteLabels from "./NoteLabels";
import NoteCollabs from "./NoteCollabs";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import NoteOverlay from "./NoteOverlay";

const Note = memo(
  ({
    note,
    noteActions,
    selectedNotesRef,
    dispatchNotes,
    setSelectedNotesIDs,
    setFadingNotes,
    handleSelectNote,
    handleNoteClick,
  }) => {
    const {
      user,
      clientID,
      showTooltip,
      hideTooltip,
      closeToolTip,
      focusedIndex,
      notesIndexMapRef,
      openSnackRef,
      notesStateRef,
    } = useAppContext();
    const { searchTerm } = useSearch();
    const userID = user?.id;
    const [isDragOver, setIsDragOver] = useState(false);
    const [colorMenuOpen, setColorMenuOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selected, setSelected] = useState(
      selectedNotesRef.current.has(note?.uuid)
    );
    const [selectedColor, setSelectedColor] = useState(note?.color);
    const uncheckedItems = note?.checkboxes?.filter((cb) => !cb.isCompleted);
    const checkedItems = note?.checkboxes?.filter((cb) => cb.isCompleted);
    const inputsRef = useRef(null);
    const inputRef = useRef(null);
    const imagesRef = useRef(null);
    const titleRef = useRef(null);
    const contentRef = useRef(null);
    const checkRef = useRef(null);
    const dragCounter = useRef(0);
    const touchTimerRef = useRef(null);
    const touchActiveRef = useRef(false);

    const ImagesWithNoBottomContent =
      note?.images?.length > 0 &&
      note?.labels?.length === 0 &&
      note?.collaborators?.length === 0 &&
      !note?.title.trim() &&
      !note?.content.trim() &&
      (note?.checkboxes.length === 0 || !note?.showCheckboxes);

    const isNoteEmpty =
      note?.images?.length === 0 &&
      note?.labels?.length === 0 &&
      note?.collaborators?.length === 0 &&
      !note?.title?.trim() &&
      !note?.content?.trim() &&
      (note?.checkboxes.length === 0 || !note?.showCheckboxes);

    const lastInputWasKeyboard = useLastInputWasKeyboard();

    const handlePinClick = async (e) => {
      closeToolTip();
      handleSelectNote({ clear: true });
      e.stopPropagation(); // Prevent note click event
      if (!note?.isArchived) {
        dispatchNotes({
          type: "PIN_NOTE",
          note: note,
        });

        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "PIN_NOTE",
          note: note,
        });

        handleServerCall(
          [
            () =>
              NoteUpdateAction({
                type: "isPinned",
                value: !note?.isPinned,
                noteUUIDs: [note?.uuid],
                clientID: clientID,
              }),
          ],
          openSnackRef.current
        );
      } else {
        noteActions({
          type: "PIN_ARCHIVED_NOTE",
          note: note,
          noteRef: note?.ref,
          index: notesIndexMapRef.current.get(note.uuid),
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
      const handleSelectAllNotes = () => {
        setSelected(true);
      };

      const handleBatchSelection = (e) => {
        const { select, deselect } = e.detail;

        if (select.includes(note?.uuid)) {
          setSelected(true);
          handleSelectNote({
            source: "batch_select",
            e: e,
            selected: selected,
            setSelected: setSelected,
            uuid: note.uuid,
            index: notesIndexMapRef.current.get(note.uuid),
            isPinned: note.isPinned,
            isArchived: note.isArchived,
          });
        }
        if (deselect.includes(note?.uuid)) {
          setSelected(false);
          setSelectedNotesIDs((prev) =>
            prev.filter((noteData) => noteData.uuid !== note?.uuid)
          );
        }
      };

      window.addEventListener("selectAllNotes", handleSelectAllNotes);
      window.addEventListener("batchSelection", handleBatchSelection);
      return () => {
        window.removeEventListener("batchSelection", handleBatchSelection);
        window.removeEventListener("selectAllNotes", handleSelectAllNotes);
      };
    }, [note?.uuid, note?.isPinned, note?.isArchived, selected]);

    const handleCheckboxClick = async (e, checkboxUUID, value) => {
      e.stopPropagation();
      dispatchNotes({
        type: "CHECKBOX_STATE",
        noteUUID: note?.uuid,
        checkboxUUID: checkboxUUID,
        value: value,
      });

      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "CHECKBOX_STATE",
        noteUUID: note?.uuid,
        checkboxUUID: checkboxUUID,
        value: value,
      });

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "checkboxes",
              operation: "MANAGE_COMPLETED",
              value: value,
              checkboxUUID: checkboxUUID,
              noteUUIDs: [note?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    };

    const handleExpand = async (e) => {
      e.stopPropagation();
      const val = !note?.expandCompleted;
      dispatchNotes({
        type: "EXPAND_ITEMS",
        noteUUID: note?.uuid,
      });

      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "EXPAND_ITEMS",
        noteUUID: note?.uuid,
      });

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "expandCompleted",
              value: val,
              noteUUIDs: [note?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    };

    const noteClassName = useMemo(() => {
      return `note ${note?.color} n-bg-${note?.background} ${isDragOver ? "transparent-border" : ""} ${!ImagesWithNoBottomContent ? "note-bottom-padding" : ""}`;
    }, [note?.color, note?.background, selected, isDragOver, ImagesWithNoBottomContent]);

    const handleDragOver = (e) => {
      e.preventDefault();
      if (note?.isTrash) return;
      setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      if (note?.isTrash) return;
      dragCounter.current -= 1;
      if (dragCounter.current === 0) {
        setIsDragOver(false);
      }
    };

    const handleNoteMouseLeave = (e) => {
      if (note?.isTrash) return;
      setIsDragOver(false);
      dragCounter.current = 0;
    };

    const handleDragEnter = (e) => {
      e.preventDefault();
      if (note?.isTrash) return;
      dragCounter.current += 1;
    };

    const handleOnDrop = (e) => {
      e.preventDefault();
      if (!inputRef.current || note?.isTrash) return;
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);

      if (files.length > 0) {
        const dt = new DataTransfer();
        files.forEach((file) => dt.items.add(file));
        inputRef.current.files = dt.files;
        const event = new Event("change", { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    };

    const handleOnFocus = () => {
      if (!lastInputWasKeyboard.current) return;

      focusedIndex.current = notesIndexMapRef.current.get(note.uuid);
    };

    function highlightMatch(text) {
      if (!searchTerm) return text;

      const regex = new RegExp(`(${searchTerm.toLowerCase().trim()})`, "ig");

      const parts = text.split(regex);

      return parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="highlight">
            {part}
          </span>
        ) : (
          part
        )
      );
    }

    return (
      <>
        {/* <button onClick={()=> console.log(note)}>ggg</button> */}
        <div
          tabIndex="0"
          onClick={(e) =>
            handleSelectNote({
              source: "note",
              e: e,
              selected: selected,
              setSelected: setSelected,
              uuid: note?.uuid,
              index: notesIndexMapRef.current.get(note.uuid),
              isPinned: note?.isPinned,
              isArchived: note.isArchived,
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSelectNote({
                source: "note",
                e: e,
                selected: selected,
                setSelected: setSelected,
                uuid: note?.uuid,
                index: notesIndexMapRef.current.get(note.uuid),
                isPinned: note?.isPinned,
                isArchived: note.isArchived,
              });
            }
          }}
          onMouseDown={(e) => e.preventDefault()}
          onFocus={handleOnFocus}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleOnDrop}
          onMouseLeave={handleNoteMouseLeave}
          onContextMenu={(e) => {
            e.preventDefault();
            closeToolTip();
            if (touchActiveRef.current) return;

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
          onTouchStart={(e) => {
            touchTimerRef.current = setTimeout(() => {
              touchActiveRef.current = true;
              handleSelectNote({
                source: "checkmark",
                e: e,
                selected: selected,
                setSelected: setSelected,
                uuid: note?.uuid,
                index: notesIndexMapRef.current.get(note.uuid),
                isPinned: note?.isPinned,
                isArchived: note.isArchived,
              });
            }, 300);
          }}
          onTouchEnd={() => {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
            requestAnimationFrame(() => {
              touchActiveRef.current = false;
            });
          }}
          className="note-wrapper"
          ref={note?.ref}
        >
          {/* <button onClick={()=> console.log(note?.images)}>click</button> */}
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
                uuid: note?.uuid,
                index: notesIndexMapRef.current.get(note.uuid),
                isPinned: note?.isPinned,
                isArchived: note.isArchived,
              })
            }
            onMouseEnter={(e) =>
              showTooltip(e, `${selected ? "Deselect note" : "Select note"}`)
            }
            onMouseLeave={hideTooltip}
          >
            <CheckMark
              color={selected ? "note-checkmark-selected" : note?.color}
              size="23"
            />
          </span>
          <div
            style={{
              minHeight: note?.openNote === false && "180px",
            }}
            className={noteClassName}
          >
            <div>
              {/* <button
                style={{
                  position: "absolute",
                  padding: "1rem",
                  zIndex: "100000000",
                }}
              >
                gg
              </button> */}
              <div>
                <div
                  style={{
                    position:
                      (note?.images?.length > 0 ||
                        (note?.checkboxes?.length > 0 &&
                          !note?.title?.trim() &&
                          !note?.content?.trim())) &&
                      "absolute",
                  }}
                  className="corner"
                />
                <div
                  style={{
                    opacity: colorMenuOpen ? "1" : undefined,
                    opacity: (colorMenuOpen || moreMenuOpen) && "1",
                  }}
                  className="pin pc-btn"
                  tabIndex="0"
                >
                  {!note?.isTrash && (
                    <Button
                      onMouseEnter={(e) =>
                        showTooltip(e, `${note?.isPinned ? "Unpin" : "Pin"}`)
                      }
                      onMouseLeave={hideTooltip}
                      onFocus={(e) =>
                        showTooltip(e, `${note?.isPinned ? "Unpin" : "Pin"}`)
                      }
                      onBlur={hideTooltip}
                      onClick={handlePinClick}
                      tabIndex="0"
                    >
                      <PinIcon
                        isPinned={note?.isPinned}
                        rotation={note?.isPinned ? "-45deg" : "-5deg"}
                      />
                    </Button>
                  )}
                </div>
                <div
                  style={{
                    position: "relative",
                    // opacity: isLoading && note?.images.length > 0 ? "0.6" : "1",
                    transition: "all 0.2s ease",
                  }}
                  ref={imagesRef}
                >
                  <NoteImagesLayout images={note?.images} />
                  {false && note?.images.length > 0 && (
                    <div className="linear-loader" />
                  )}
                </div>

                {isNoteEmpty && (
                  <div className="empty-note" aria-label="Empty note" />
                )}
                <div ref={inputsRef}>
                  {note?.title?.trim() && (
                    <div dir="auto" ref={titleRef} className="title">
                      {highlightMatch(note?.title)}
                    </div>
                  )}
                  {note?.content?.trim() && (
                    <div dir="auto" ref={contentRef} className="content">
                      {highlightMatch(note?.content)}
                    </div>
                  )}
                </div>

                {note?.checkboxes?.length > 0 && note?.showCheckboxes && (
                  <div
                    style={{
                      paddingTop: !note?.content?.trim() && "0.625rem",
                      paddingBottom: "0.4rem",
                    }}
                  >
                    {uncheckedItems.map((checkbox, index) => {
                      return (
                        <div
                          key={checkbox?.uuid || index}
                          className="checkbox-wrapper note-checkbox-wrapper"
                          style={{
                            wordBreak: "break-all",
                            paddingLeft: checkbox.parent ? "1.8rem" : "0.7rem",
                            paddingRight:
                              !note?.content.trim() &&
                              !note?.title.trim() &&
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

                    {checkedItems.length > 0 && !note?.expandCompleted && (
                      <div
                        className="completed-items completed-items-note"
                        aria-label={`${checkedItems.length} Completed item${
                          checkedItems.length === 1 ? "" : "s"
                        }`}
                      />
                    )}

                    {note?.expandCompleted &&
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
                {(note?.labels?.length > 0 ||
                  note?.collaborators?.length > 0) && (
                  <div className="note-misc-container n-misc">
                    {note?.labels.length !== 0 && (
                      <NoteLabels note={note} noteActions={noteActions} />
                    )}
                    {note?.collaborators && (
                      <NoteCollabs
                        note={note}
                        handleNoteClick={handleNoteClick}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            {note?.openNote === false && <NoteOverlay note={note} />}
          </div>
          <NoteTools
            colorMenuOpen={colorMenuOpen}
            handleNoteClick={handleNoteClick}
            setColorMenuOpen={handleMenuIsOpenChange}
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
            noteActions={noteActions}
            inputRef={inputRef}
          />
          <div
            className="note-border element-selected"
            style={{ opacity: selected && !isDragOver ? "1" : "0" }}
          />
          <AnimatePresence>{isDragOver && <ImageDropZone />}</AnimatePresence>
        </div>
      </>
    );
  }
);

Note.displayName = "Note";

export default Note;
