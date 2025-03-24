import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import "@/assets/styles/note.css";
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
    dispatchNotes,
    calculateLayout,
    isLoadingImagesAddNote = [],
    setSelectedNotesIDs,
    selectedNotes,
    handleSelectNote,
    isDragging,
    setTooltipAnchor,
    openSnackFunction,
    index,
  }) => {
    const { handleLabelNoteCount, labelsRef } = useAppContext();
    const { data: session } = useSession();
    const userID = session?.user?.id;
    const [colorMenuOpen, setColorMenuOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [isLoadingImages, setIsLoadingImages] = useState([]);
    const [selected, setSelected] = useState(false);
    const isLoading = isLoadingImagesAddNote.includes(note.uuid);
    const noteRef = useRef(null);
    const inputsRef = useRef(null);
    const imagesRef = useRef(null);
    const noteStuffRef = useRef(null);
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
          await NoteUpdateAction(
            "isPinned",
            !note.isPinned,
            [note.uuid],
            first
          );
        } finally {
          window.dispatchEvent(new Event("loadingEnd"));
        }
      } else {
        noteActions({
          type: "PIN_ARCHIVED_NOTE",
          note: note,
          noteRef: noteRef,
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
        text: prev.text,
      }));
    };

    const removeLabel = async (labelUUID) => {
      dispatchNotes({
        type: "REMOVE_LABEL",
        note: note,
        labelUUID: labelUUID,
      });
      handleLabelNoteCount(labelUUID, "decrement");
      window.dispatchEvent(new Event("loadingStart"));
      await removeLabelAction({
        noteUUID: note.uuid,
        labelUUID: labelUUID,
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    return (
      <>
        <div className="note-wrapper" ref={noteRef}>
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
                note.content
                  ? "45px"
                  : "0px  ",
            }}
            className={`note ${note.color} ${"n-bg-" + note.background} ${
              selected
                ? "element-selected"
                : note.color === "Default"
                ? "default-border"
                : "transparent-border"
            }`}
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
            <div ref={noteStuffRef}>
              {note.images.length === 0 && <div className="corner" />}
              <div
                style={{
                  opacity: colorMenuOpen ? "1" : undefined,
                  opacity: (colorMenuOpen || moreMenuOpen) && "1",
                }}
                className="pin"
              >
                {!note.isTrash && (
                  <Button
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, `${note.isPinned ? "Unpin" : "Pin"}`)
                    }
                    onMouseLeave={handleMouseLeave}
                    onClick={handlePinClick}
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
                  opacity: isLoading && note.images.length > 0 ? "0.6" : "1",
                  transition: "all 0.2s ease",
                }}
                ref={imagesRef}
              >
                <NoteImagesLayout
                  images={note.images}
                  calculateMasonryLayout={calculateLayout}
                  isLoadingImages={isLoadingImages}
                />
                {isLoading && note.images.length > 0 && (
                  <div className="linear-loader" />
                )}
              </div>

              {note.images.length === 0 &&
                note.labels.length === 0 &&
                !note.title?.trim() &&
                !note.content?.trim() && (
                  <div className="empty-note" aria-label="Empty note" />
                )}
              <div ref={inputsRef}>
                {note.title?.trim() && (
                  <div ref={titleRef} className="title">
                    {note.title}
                  </div>
                )}
                {note.content?.trim() && (
                  <div ref={contentRef} className="content">
                    {note.content}
                  </div>
                )}
              </div>
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
                            onClick={(e) => e.stopPropagation()}
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
                              onClick={() => {
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
          <NoteTools
            colorMenuOpen={colorMenuOpen}
            setColorMenuOpen={handleMenuIsOpenChange}
            setTooltipAnchor={setTooltipAnchor}
            moreMenuOpen={moreMenuOpen}
            setMoreMenuOpen={setMoreMenuOpen}
            images={note.images.length !== 0}
            note={note}
            noteRef={noteRef}
            dispatchNotes={dispatchNotes}
            setIsLoadingImages={setIsLoadingImages}
            userID={userID}
            openSnackFunction={openSnackFunction}
            noteActions={noteActions}
            index={index}
          />
        </div>
      </>
    );
  }
);

Note.displayName = "Note";

export default Note;
