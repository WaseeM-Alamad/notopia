import { useAppContext } from "@/context/AppContext";
import { useSearch } from "@/context/SearchContext";
import {
  NoteImageDeleteAction,
  NoteTextUpdateAction,
  NoteUpdateAction,
  removeLabelAction,
  undoAction,
} from "@/utils/actions";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";

import Button from "../Tools/Button";
import PinIcon from "../icons/PinIcon";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import { debounce } from "lodash";
import NoteModalTools from "./NoteModalTools";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import ListItemsLayout from "./ListitemsLayout";
import { AnimatePresence } from "framer-motion";
import ImageDropZone from "../Tools/ImageDropZone";
import TextLabelMenu from "./TextLabelMenu";
import NoteLabels from "./NoteLabels";
import NoteCollabs from "./NoteCollabs";

const NoteEditor = ({
  note,
  localNote,
  setLocalNote,
  localIsPinned,
  setLocalIsPinned,
  isOpen,
  setIsOpen,
  setModalStyle,
  undoStack,
  setUndoStack,
  redoStack,
  setRedoStack,
  modalRef,
  modalOpenRef,
  titleRef,
  contentRef,
  labelsRef,
  archiveRef,
  trashRef,
  delayLabelDispatchRef,
  openSnackRef,
  noteActions,
  dispatchNotes,
  notesStateRef,
  initialStyle,
  setInitialStyle,
  noteEditorRef,
  openCollab,
}) => {
  const { filters } = useSearch();
  const { user, clientID, showTooltip, hideTooltip, closeToolTip } =
    useAppContext();

  const userID = user?.id;

  const [isDragOver, setIsDragOver] = useState(false);
  const [labelAnchor, setLabelAnchor] = useState(null);
  const [labelSearch, setLabelSearch] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const formattedEditedDate = isOpen
    ? getNoteFormattedDate(localNote?.updatedAt)
    : null;

  const formattedCreatedAtDate = isOpen
    ? getNoteFormattedDate(note?.createdAt)
    : null;

  const ignoreTopRef = useRef(false);
  const inputRef = useRef(null);
  const dragCounter = useRef(0);
  const inputsContainerRef = useRef(null);

  useEffect(() => {
    const inputsContainer = inputsContainerRef.current;
    if (!inputsContainer || !isOpen) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = inputsContainer;
      const fromBottom = !(scrollTop + clientHeight >= scrollHeight - 1);
      const fromTop = scrollTop !== 0;
      setIsScrolled({ fromTop, fromBottom });
    };

    inputsContainer.addEventListener("scroll", handleScroll);
    requestAnimationFrame(() => {
      handleScroll();
    });

    return () => {
      inputsContainer.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleNoteMouseLeave = (e) => {
    setIsDragOver(false);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
  };

  const handleOnDrop = (e) => {
    e.preventDefault();
    if (!inputRef.current) return;
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

  const inputsContainerClick = () => {
    if (!localNote?.isTrash) return;

    const undo = async () => {
      setLocalNote((prev) => ({ ...prev, isTrash: true }));

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "isTrash",
              value: true,
              noteUUIDs: [localNote?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    };

    const restore = async () => {
      setLocalNote((prev) => ({ ...prev, isTrash: false }));
      openSnackRef.current({
        snackMessage: "Note restored",
        snackOnUndo: undo,
        snackRedo: restore,
      });

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "isTrash",
              value: false,
              noteUUIDs: [localNote?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    };

    openSnackRef.current({
      snackMessage: "Can't edit in Trash",
      snackOnUndo: restore,
      noActionUndone: true,
    });
  };

  const handleLabelClick = (e, label) => {
    e.stopPropagation();
    const encodedLabel = encodeURIComponent(label);
    window.location.hash = `label/${encodedLabel.toLowerCase()}`;
  };

  const handlePinClick = async () => {
    if (localNote?.isTrash) return;
    setLocalIsPinned((prev) => !prev);
    if (!localNote?.isArchived) {
      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "isPinned",
              value: !localIsPinned,
              noteUUIDs: [note?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    } else {
      const redo = async () => {
        if (!localIsPinned) {
          handleServerCall(
            [
              () =>
                NoteUpdateAction({
                  type: "pinArchived",
                  value: true,
                  noteUUIDs: [note?.uuid],
                  clientID: clientID,
                }),
            ],
            openSnackRef.current
          );
        } else {
          handleServerCall(
            [
              () =>
                undoAction({
                  type: "UNDO_PIN_ARCHIVED",
                  noteUUID: note?.uuid,
                  initialIndex: initialStyle.index,
                  endIndex: 0,
                  clientID: clientID,
                }),
            ],
            openSnackRef.current
          );
        }
      };
      redo();
      const undo = async () => {
        setLocalIsPinned(false);
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "UNDO_PIN_ARCHIVED",
          note: note,
          initialIndex: initialStyle.index,
        });
        dispatchNotes({
          type: "UNDO_PIN_ARCHIVED",
          note: note,
          initialIndex: initialStyle.index,
        });

        handleServerCall(
          [
            () =>
              undoAction({
                type: "UNDO_PIN_ARCHIVED",
                noteUUID: note?.uuid,
                initialIndex: initialStyle.index,
                endIndex: 0,
                clientID: clientID,
              }),
          ],
          openSnackRef.current
        );
      };

      openSnackRef.current({
        snackMessage: "Note unarchived and pinned",
        snackOnUndo: undo,
        snackRedo: redo,
      });
    }
  };

  const noteImageDelete = useCallback(
    async (imageUUID, imageURL) => {
      const imageObject = { url: imageURL, uuid: imageUUID };
      let imageIndex;

      setLocalNote((prev) => ({
        ...prev,
        images: prev.images.reduce((acc, image, index) => {
          if (image.uuid === imageUUID) {
            imageIndex = index;
            return acc;
          }
          acc.push(image);
          return acc;
        }, []),
      }));

      const undo = async () => {
        setLocalNote((prev) => {
          const updatedImages = [...prev.images];
          updatedImages.splice(imageIndex, 0, imageObject);
          return { ...prev, images: updatedImages };
        });
      };

      const onClose = async () => {
        const creatorID = note?.creator?._id;
        if (!creatorID || !note?.uuid || !imageUUID) return;
        const filePath = `${creatorID}/${note?.uuid}/${imageUUID}`;
        handleServerCall(
          [
            () =>
              NoteImageDeleteAction(filePath, note?.uuid, imageUUID, clientID),
          ],
          openSnackRef.current
        );
      };

      openSnackRef.current({
        snackMessage: "Image deleted",
        snackOnUndo: undo,
        snackOnClose: onClose,
        unloadWarn: true,
      });
    },
    [note?.uuid]
  );

  const handlePaste = (e, max) => {
    e.preventDefault();
    if (!max) return;
    const prevText = e.target.innerText === "\n" ? "" : e.target.innerText;

    // Get plain text from clipboard
    const pasteText = e.clipboardData.getData("text/plain");
    const pasteLength = pasteText.length;
    const prevLength = prevText.length;
    // Insert only the text at cursor position

    const isOverflow = prevLength + pasteLength >= max;

    let validPaste = pasteText;

    if (isOverflow) {
      const sub = max - prevLength;
      if (sub <= 0) return;
      validPaste = pasteText.slice(0, sub);
    }

    document.execCommand("insertText", false, validPaste);
  };

  const handleBeforeInput = (e, max) => {
    if (!max) return;
    const text = e.target.innerText;
    const t = text === "\n" ? "" : text;
    // const charactersLeft = max - t.length;

    // if (charactersLeft < 101) {
    //   openSnackRef.current({
    //     closeOnChange: false,
    //     snackMessage: `${max - t.length} Characters left`,
    //     showUndo: false,
    //   });
    // }
    if (t.length + 1 > max) {
      e.preventDefault();
    }
  };

  const updateTextDebounced = useCallback(
    debounce(async (values) => {
      handleServerCall(
        [() => NoteTextUpdateAction(values, note?.uuid, clientID)],
        openSnackRef.current
      );
    }, 600),
    [note?.uuid] // Dependencies array, make sure it's updated when `note?.uuid` changes
  );

  const titleDebouncedSetUndo = debounce((data) => {
    setUndoStack((prev) => [...prev, data]);
  }, 120);

  const contentDebouncedSetUndo = debounce((data) => {
    setUndoStack((prev) => [...prev, data]);
  }, 100);

  const handleUndo = async () => {
    if (undoStack.length === 1) {
      setRedoStack((prev) => [...prev, undoStack[0]]);
      setUndoStack([]);
      titleRef.current.innerText = note?.title;
      contentRef.current.innerText = note?.content;
      setLocalNote((prev) => ({
        ...prev,
        title: note?.title,
        content: note?.content,
      }));

      handleServerCall(
        [
          () =>
            NoteTextUpdateAction(
              { title: note?.title, content: note?.content },
              note?.uuid,
              clientID
            ),
        ],
        openSnackRef.current
      );
    } else {
      const redoItem = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, redoItem]);
      const updatedStack = undoStack.slice(0, -1);
      setUndoStack(updatedStack);
      const undoItem = updatedStack[updatedStack.length - 1];

      titleRef.current.innerText = undoItem.title;
      contentRef.current.innerText = undoItem.content;
      setLocalNote((prev) => ({
        ...prev,
        title: undoItem.title,
        content: undoItem.content,
      }));

      handleServerCall(
        [
          () =>
            NoteTextUpdateAction(
              { title: undoItem.title, content: undoItem.content },
              note?.uuid,
              clientID
            ),
        ],
        openSnackRef.current
      );
    }
  };

  const handleRedo = async () => {
    const undoItem = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, undoItem]);
    setRedoStack((prev) => prev.slice(0, -1));
    const redoItem = redoStack[redoStack.length - 1];

    titleRef.current.innerText = redoItem.title;
    contentRef.current.innerText = redoItem.content;
    setLocalNote((prev) => ({
      ...prev,
      title: redoItem.title,
      content: redoItem.content,
    }));

    handleServerCall(
      [
        () =>
          NoteTextUpdateAction(
            { title: redoItem.title, content: redoItem.content },
            note?.uuid,
            clientID
          ),
      ],
      openSnackRef.current
    );
  };

  const getCaretCharacterOffsetWithin = (element) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return 0;

    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();

    preRange.selectNodeContents(element);
    preRange.setEnd(range.endContainer, range.endOffset);

    return preRange.toString().length;
  };

  function getVirtualAnchorAtHash(container, hashIndex) {
    const textNode = container.firstChild;
    if (!textNode || textNode.nodeType !== 3) return null;

    const range = document.createRange();
    range.setStart(textNode, hashIndex);
    range.setEnd(textNode, hashIndex);

    const rect = range.getClientRects()[0];
    if (!rect) return null;

    return {
      getBoundingClientRect: () => new DOMRect(rect.left, rect.top, 0, 0),
      contextElement: container,
    };
  }

  const handleLabelMenu = (container, text) => {
    const caretPos = getCaretCharacterOffsetWithin(container);

    const textBeforeCaret = text.slice(0, caretPos);
    const hashIndex = textBeforeCaret.lastIndexOf("#");

    if (hashIndex === -1) {
      setLabelAnchor(false);
      setLabelSearch("");
      return;
    }

    const afterHash = text.slice(hashIndex);
    const match = afterHash.match(/#(\w*)$/);
    const hashEnd = hashIndex + (match ? match[0].length : 1);

    if (caretPos >= hashIndex && caretPos <= hashEnd) {
      setLabelSearch(match ? match[1] : "");
      const virtualAnchor = getVirtualAnchorAtHash(container, hashIndex);
      setLabelAnchor(virtualAnchor);
    } else {
      setLabelAnchor(false);
      setLabelSearch("");
    }
  };

  const handleTitleInput = useCallback(
    (e) => {
      if (localNote?.isTrash) return;

      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;
      titleDebouncedSetUndo({ title: t, content: localNote?.content });

      const charactersLeft = 999 - t.length;

      if (charactersLeft < 101) {
        openSnackRef.current({
          closeOnChange: false,
          snackMessage: `${999 - t.length} Characters left`,
          showUndo: false,
        });
      }

      const container = e.currentTarget;

      handleLabelMenu(container, t);

      setLocalNote((prev) => ({
        ...prev,
        title: t,
        updatedAt: new Date(),
      }));

      updateTextDebounced({ title: t, content: localNote?.content });

      if (text === "\n") {
        e.target.innerText = "";
      }
    },
    [note?.content, note?.title, localNote?.isTrash, undoStack]
  );

  const handleContentInput = useCallback(
    (e) => {
      if (localNote?.isTrash) return;
      const text = e.target.innerText;
      const t = text === "\n" ? "" : text;

      contentDebouncedSetUndo({ title: localNote?.title, content: t });

      const charactersLeft = 19999 - t.length;

      if (charactersLeft === 0) {
        openSnackRef.current({
          closeOnChange: false,
          snackMessage: `${19999 - t.length} Characters left`,
          showUndo: false,
        });
      }

      setLocalNote((prev) => ({
        ...prev,
        content: t,
        updatedAt: new Date(),
      }));

      updateTextDebounced({ title: localNote?.title, content: t });

      if (text === "\n") {
        e.target.innerText = "";
      }
    },
    [note?.content, note?.title, localNote?.isTrash, undoStack]
  );

  const removeLabel = async (labelUUID) => {
    const newLabels = localNote?.labels.filter(
      (noteLabelUUID) => noteLabelUUID !== labelUUID
    );
    setLocalNote((prev) => ({ ...prev, labels: newLabels }));

    handleServerCall(
      [
        () =>
          removeLabelAction({
            noteUUID: note?.uuid,
            labelUUID: labelUUID,
            clientID: clientID,
          }),
      ],
      openSnackRef.current
    );
  };

  return (
    <div
      ref={noteEditorRef}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleOnDrop}
      onMouseLeave={handleNoteMouseLeave}
      className={`modall n-bg-${localNote?.background}`}
    >
      <div
        className={`modal-top-section ${isScrolled.fromTop && localNote?.background === "DefaultBG" && localNote?.color === "Default" ? "distinct-section-mobile" : ""}`}
      >
        <Button
          className="modal-back-icon btn-hover"
          onClick={() => setIsOpen(false)}
        />

        <button className="modal-mobile-btn" onClick={handlePinClick}>
          <PinIcon
            rotation={localIsPinned ? "-45deg" : "-5deg"}
            isPinned={localIsPinned}
          />
        </button>
        <button
          onClick={() => {
            closeToolTip();
            archiveRef.current = true;
            setIsOpen(false);
          }}
          className="modal-mobile-btn archive-icon"
        />
        <button className="modal-mobile-btn reminder-icon" />
      </div>
      <div
        onClick={inputsContainerClick}
        ref={inputsContainerRef}
        style={{
          overflowY: !isOpen && "hidden",
        }}
        className={`modal-inputs-container ${"n-bg-" + localNote?.background}`}
      >
        {localNote?.images.length === 0 && (
          <div className={isOpen ? `modal-corner` : `corner`} />
        )}
        {!localNote?.isTrash && (
          <div style={{ opacity: !isOpen && "0" }} className="modal-pin">
            <Button
              onClick={handlePinClick}
              disabled={!isOpen}
              className="btn-hover"
            >
              <PinIcon
                isPinned={localIsPinned}
                rotation={localIsPinned ? "-45deg" : "-5deg"}
                images={localNote?.images.length !== 0}
              />
            </Button>
          </div>
        )}
        <NoteImagesLayout
          images={localNote?.images}
          // isLoadingImages={isLoadingImages}
          isTrash={localNote?.isTrash}
          deleteSource="note"
          noteImageDelete={noteImageDelete}
          modalOpen={isOpen}
        />
        {/* {isLoading && <div className="linear-loader" />} */}
        {!isOpen &&
          localNote?.images.length === 0 &&
          !localNote?.title?.trim() &&
          !localNote?.content?.trim() &&
          (localNote?.checkboxes?.length === 0 ||
            !localNote?.showCheckboxes) && (
            <div className="empty-note" aria-label="Empty note" />
          )}
        <div
          style={{
            opacity: isOpen
              ? "1"
              : localNote?.content && !localNote?.title
                ? "0"
                : !localNote?.title && !localNote?.content
                  ? "0"
                  : "1",
          }}
          contentEditable={!localNote?.isTrash}
          dir="auto"
          suppressContentEditableWarning
          onInput={handleTitleInput}
          onBeforeInput={(e) => handleBeforeInput(e, 999)}
          onPaste={(e) => handlePaste(e, 999)}
          ref={titleRef}
          className="
               modal-title-input modal-editable-title"
          role="textbox"
          tabIndex="0"
          aria-multiline="true"
          aria-label={!localNote?.isTrash ? "Title" : ""}
          spellCheck="false"
        />
        <div
          style={{
            opacity: isOpen
              ? "1"
              : !localNote?.content && localNote?.title
                ? "0"
                : !localNote?.title && !localNote?.content
                  ? "0"
                  : "1",
            minHeight: "30px",
            transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
          }}
          contentEditable={!localNote?.isTrash}
          dir="auto"
          suppressContentEditableWarning
          onInput={handleContentInput}
          onBeforeInput={(e) => handleBeforeInput(e, 19999)}
          onPaste={(e) => handlePaste(e, 19999)}
          ref={contentRef}
          className={`${"modal-content-input"} modal-editable-content`}
          role="textbox"
          tabIndex="0"
          aria-multiline="true"
          aria-label={!localNote?.isTrash ? "Take a note..." : ""}
          spellCheck="false"
        />
        {localNote?.checkboxes && (
          <ListItemsLayout
            localNote={localNote}
            setLocalNote={setLocalNote}
            ignoreTopRef={ignoreTopRef}
            dispatchNotes={dispatchNotes}
            isOpen={isOpen}
          />
        )}

        {(localNote?.labels?.length > 0 ||
          localNote?.collaborators?.length > 0) && (
          <div className="note-misc-container">
            {localNote?.labels.length !== 0 && (
              <NoteLabels
                note={localNote}
                modalRemoveLabel={removeLabel}
                noteActions={noteActions}
              />
            )}
            {localNote?.collaborators && (
              <NoteCollabs
                note={localNote}
                modalView={true}
                openCollab={openCollab}
              />
            )}
          </div>
        )}

        <div style={{ opacity: !isOpen && "0" }} className="modal-date-section">
          <div onClick={(e) => e.stopPropagation()} className="edited">
            {localNote?.isTrash
              ? "Note in Trash  •  "
              : localNote?.isArchived
                ? "Note in Archive  •  "
                : ""}
            <span
              onMouseEnter={(e) =>
                showTooltip(e, "Created " + formattedCreatedAtDate)
              }
              onMouseLeave={hideTooltip}
            >
              Edited
              {" " + formattedEditedDate}
            </span>
          </div>
        </div>
      </div>
      <NoteModalTools
        openCollab={openCollab}
        modalOpenRef={modalOpenRef}
        filters={filters}
        delayLabelDispatchRef={delayLabelDispatchRef}
        archiveRef={archiveRef}
        trashRef={trashRef}
        setLocalNote={setLocalNote}
        localNote={localNote}
        note={note}
        noteActions={noteActions}
        dispatchNotes={dispatchNotes}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        setModalStyle={setModalStyle}
        undoStack={undoStack}
        redoStack={redoStack}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        inputRef={inputRef}
        setInitialStyle={setInitialStyle}
        isScrolled={isScrolled}
      />
      <AnimatePresence>{isDragOver && <ImageDropZone />}</AnimatePresence>
      <AnimatePresence>
        {labelAnchor && (
          <TextLabelMenu
            anchor={labelAnchor}
            setAnchor={setLabelAnchor}
            labelSearch={labelSearch}
            setLabelSearch={setLabelSearch}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(NoteEditor);
