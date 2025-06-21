import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import "@/assets/styles/LinearLoader.css";
import NoteTools from "./NoteTools";
import PinIcon from "../icons/PinIcon";
import { NoteUpdateAction, removeLabelAction } from "@/utils/actions";
import Button from "../Tools/Button";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import { useSession } from "next-auth/react";
import CheckMark from "../icons/CheckMark";
import { useAppContext } from "@/context/AppContext";
import { useSearch } from "@/context/SearchContext";

const FilteredNote = memo(
  ({
    note,
    noteActions,
    dispatchNotes,
    selectedNotesRef,
    calculateLayout,
    isLoadingImagesAddNote = [],
    setSelectedNotesIDs,
    setFadingNotes,
    selectedNotes,
    handleSelectNote,
    isDragging,
    setTooltipAnchor,
    openSnackFunction,
    index,
  }) => {
    const { searchTerm } = useSearch();
    const { handleLabelNoteCount, labelsRef } = useAppContext();
    const { data: session } = useSession();
    const userID = session?.user?.id;
    const [colorMenuOpen, setColorMenuOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [isLoadingImages, setIsLoadingImages] = useState([]);
    const [selected, setSelected] = useState(
      selectedNotesRef.current.has(note.uuid)
    );
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedColor, setSelectedColor] = useState(note.color);
    const isLoading = isLoadingImagesAddNote.includes(note.uuid);
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

    const removeLabel = async (labelUUID) => {
      noteActions({
        type: "REMOVE_LABEL",
        note: note,
        labelUUID: labelUUID,
      });
      // dispatchNotes({
      //   type: "REMOVE_LABEL",
      //   note: note,
      //   labelUUID: labelUUID,
      // });
      // handleLabelNoteCount(labelUUID, "decrement");
      // window.dispatchEvent(new Event("loadingStart"));
      // await removeLabelAction({
      //   noteUUID: note.uuid,
      //   labelUUID: labelUUID,
      // });
      // window.dispatchEvent(new Event("loadingEnd"));
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
            <div>
              {note.images.length === 0 && <div className="corner" />}
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
                      handleMouseEnter(e, `${note.isPinned ? "Unpin" : "Pin"}`)
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
                  <div dir="auto" ref={titleRef} className="title">
                    {highlightMatch(note.title)}
                  </div>
                )}
                {note.content?.trim() && (
                  <div dir="auto" ref={contentRef} className="content">
                    {highlightMatch(note.content)}
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
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            setFadingNotes={setFadingNotes}
            setMoreMenuOpen={setMoreMenuOpen}
            images={note.images.length !== 0}
            note={note}
            isFilteredNote={true}
            anchorEl={anchorEl}
            setAnchorEl={setAnchorEl}
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

FilteredNote.displayName = "FilteredNote";

export default FilteredNote;
