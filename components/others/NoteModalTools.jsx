import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Button from "../Tools/Button";
import ColorSelectMenu from "./ColorSelectMenu";
import BackIcon from "../icons/BackIcon";
import { DeleteNoteAction, NoteUpdateAction } from "@/utils/actions";
import { v4 as uuid } from "uuid";
import { AnimatePresence } from "framer-motion";
import ManageModalLabels from "./ManageModalLabels";
import DeleteModal from "./DeleteModal";
import { useAppContext } from "@/context/AppContext";
import MoreMenu from "./MoreMenu";
import { validateImageFile } from "@/utils/validateImage";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";

const ModalTools = ({
  localNote,
  isOpen,
  modalOpenRef,
  filters,
  setLocalNote,
  dispatchNotes,
  delayDispatchRef,
  note,
  noteActions,
  archiveRef,
  trashRef,
  imagesChangedRef,
  setIsOpen,
  undoStack,
  redoStack,
  handleUndo,
  handleRedo,
  inputRef,
  inputsContainerRef,
}) => {
  const {
    setLoadingImages,
    user,
    clientID,
    showTooltip,
    hideTooltip,
    closeToolTip,
    openSnackRef,
    notesStateRef,
  } = useAppContext();
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userID = user?.id;
  const closeRef = useRef(null);

  useEffect(() => {
    const inputsContainer = inputsContainerRef.current;
    if (!inputsContainer || !isOpen) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = inputsContainer;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
      setIsScrolled(isAtBottom);
    };

    inputsContainer.addEventListener("scroll", handleScroll);
    requestAnimationFrame(() => {
      handleScroll();
    });

    return () => {
      inputsContainer.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  const handleColorClick = useCallback(async (color) => {
    if (color === localNote?.color) return;
    setLocalNote((prev) => ({ ...prev, color: color }));

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "color",
            value: color,
            noteUUIDs: [note.uuid],
            clientID: clientID
          }),
      ],
      openSnackRef.current
    );
  });

  const handleBackground = useCallback(
    async (newBG) => {
      closeToolTip();
      if (localNote?.background === newBG) return;
      setLocalNote((prev) => ({ ...prev, background: newBG }));

      // dispatchNotes({
      //   type: "UPDATE_BG",
      //   note: note,
      //   newBG: newBG,
      // });

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "background",
              value: newBG,
              noteUUIDs: [note.uuid],
              clientID: clientID
            }),
        ],
        openSnackRef.current
      );
    },
    [localNote?.background]
  );

  const handleOnChange = async (event) => {
    const formData = new FormData();
    const files = Array.from(event.target?.files || []);

    if (files.length === 0) return;

    const imageUUIDs = [];
    const newImages = [];
    let isInvalidFile = false;
    let invalidCount = 0;

    formData.append("noteUUID", note.uuid);

    for (const file of files) {
      const { valid } = await validateImageFile(file);

      if (!valid) {
        isInvalidFile = true;
        invalidCount++;
        continue;
      }

      const imageUUID = uuid();
      imageUUIDs.push(imageUUID);

      formData.append("files", file);
      formData.append("imageUUIDs", imageUUID);
      formData.append("clientID", clientID);

      const imageURL = URL.createObjectURL(file);

      newImages.push({ url: imageURL, uuid: imageUUID });
    }

    if (isInvalidFile) {
      openSnackRef.current({
        snackMessage:
          "Can’t upload this file. We accept GIF, JPEG, JPG, PNG files less than 10MB and 25 megapixels.",
        showUndo: false,
      });
    }

    if (invalidCount === files.length) {
      return;
    }

    setLocalNote((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));

    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      imageUUIDs.forEach((id) => newSet.add(id));
      return newSet;
    });

    window.dispatchEvent(new Event("loadingStart"));

    const res = await fetch("/api/note/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    window.dispatchEvent(new Event("loadingEnd"));

    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      imageUUIDs.forEach((id) => newSet.delete(id));
      return newSet;
    });

    if (data.error) {
      openSnackRef.current({
        snackMessage: "Error uploading images",
        showUndo: false,
      });
    } else {
      const updatedImages = data;
      const imagesMap = new Map();

      updatedImages.forEach((imageData) => {
        imagesMap.set(imageData.uuid, imageData);
      });

      if (!modalOpenRef.current) {
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "UPDATE_IMAGES",
          note: note,
          imagesMap: imagesMap,
        });
        dispatchNotes({
          type: "UPDATE_IMAGES",
          note: note,
          imagesMap: imagesMap,
        });
      } else {
        const modalUpdatedImages = [...note.images, ...newImages].map((img) => {
          if (imagesMap.has(img.uuid)) return imagesMap.get(img.uuid);
          return img;
        });

        setLocalNote((prev) => ({
          ...prev,
          images: modalUpdatedImages,
        }));
      }
    }
  };

  const restoreNote = async () => {
    closeToolTip();
    const undo = async () => {
      setLocalNote((prev) => ({ ...prev, isTrash: true }));

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "isTrash",
              value: true,
              noteUUIDs: [localNote.uuid],
              clientID: clientID
            }),
        ],
        openSnackRef.current
      );
    };

    const redo = async () => {
      setLocalNote((prev) => ({ ...prev, isTrash: false }));

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "isTrash",
              value: false,
              noteUUIDs: [localNote.uuid],
              clientID: clientID
            }),
        ],
        openSnackRef.current
      );
    };

    redo();

    openSnackRef.current({
      snackMessage: "Note restored",
      snackOnUndo: undo,
      snackRedo: redo,
    });
  };

  const toggleColorMenu = (e) => {
    closeToolTip();
    setColorAnchorEl(e.currentTarget);
    setColorMenuOpen(!colorMenuOpen);
  };

  const handleModalArchive = (e) => {
    closeToolTip();
    archiveRef.current = true;

    setIsOpen(false);
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteNote = async () => {
    setIsOpen(false);

    setTimeout(() => {
      noteActions({
        type: "DELETE_NOTE",
        note: note,
        noteRef: note.ref,
      });
    }, 220);

    handleServerCall(
      [() => DeleteNoteAction(localNote.uuid, clientID)],
      openSnackRef.current
    );
  };

  const handleTrashNote = async (e) => {
    trashRef.current = true;
    setIsOpen(false);
    setMoreMenuOpen(false);
  };

  const handleLabels = () => {
    setLabelsOpen(true);
    setMoreMenuOpen(false);
  };

  const handleMakeCopy = (e) => {
    noteActions({
      type: "COPY_NOTE",
      setMoreMenuOpen: setMoreMenuOpen,
      note: note,
    });
  };

  const handleAddCheckboxes = async () => {
    const newUUID = uuid();
    const checkbox = {
      uuid: newUUID,
      content: "List item",
      isCompleted: false,
      parent: null,
      children: [],
    };

    setLocalNote((prev) => ({
      ...prev,
      checkboxes: [...prev.checkboxes, checkbox],
    }));

    setMoreMenuOpen(false);

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "checkboxes",
            operation: "ADD",
            value: checkbox,
            noteUUIDs: [note.uuid],
            clientID: clientID
          }),
      ],
      openSnackRef.current
    );
  };

  const uncheckAllitems = async () => {
    const newCheckboxArr = localNote?.checkboxes.map((checkbox) => {
      if (!checkbox.isCompleted) return checkbox;
      return { ...checkbox, isCompleted: false };
    });

    setLocalNote((prev) => ({ ...prev, checkboxes: newCheckboxArr }));

    setMoreMenuOpen(false);

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "checkboxes",
            operation: "UNCHECK_ALL",
            noteUUIDs: [note.uuid],
            clientID: clientID
          }),
      ],
      openSnackRef.current
    );
  };

  const deleteCheckedItems = async () => {
    const newCheckboxArr = localNote?.checkboxes.filter(
      (ch) => !ch.isCompleted
    );

    setLocalNote((prev) => ({ ...prev, checkboxes: newCheckboxArr }));

    setMoreMenuOpen(false);

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "checkboxes",
            operation: "DELETE_CHECKED",
            noteUUIDs: [note.uuid],
            clientID: clientID
          }),
      ],
      openSnackRef.current
    );
  };

  const handleCheckboxVis = async () => {
    setLocalNote((prev) => ({ ...prev, showCheckboxes: !prev.showCheckboxes }));
    setMoreMenuOpen(false);

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "showCheckboxes",
            value: !note.showCheckboxes,
            noteUUIDs: [note.uuid],
            clientID: clientID
          }),
      ],
      openSnackRef.current
    );
  };

  const menuItems = [
    {
      title: "Delete note",
      function: handleTrashNote,
      icon: "trash-menu-icon",
    },
    {
      title: localNote?.labels.length === 0 ? "Add label" : "Change labels",
      function: handleLabels,
      icon: "label-menu-icon",
    },
    {
      title: !localNote?.isTrash
        ? localNote?.checkboxes.some((checkbox) => checkbox.isCompleted)
          ? "Uncheck all items"
          : ""
        : "",
      function: uncheckAllitems,
      icon: "uncheck-checkbox-menu-icon",
    },
    {
      title: !localNote?.isTrash
        ? localNote?.checkboxes.some((checkbox) => checkbox.isCompleted)
          ? "Delete checked items"
          : ""
        : "",
      function: deleteCheckedItems,
      icon: "delete-checkbox-menu-icon",
    },
    {
      title: !localNote?.isTrash
        ? localNote?.checkboxes.length > 0
          ? localNote?.showCheckboxes
            ? "Hide checkboxes"
            : "Show checkboxes"
          : ""
        : "",
      function: handleCheckboxVis,
      icon:
        localNote?.checkboxes.length > 0
          ? localNote?.showCheckboxes
            ? "hide-checkbox-menu-icon"
            : "add-checkbox-menu-icon"
          : "",
    },
    {
      title: !localNote?.isTrash
        ? localNote?.checkboxes.length === 0
          ? "Add checkboxes"
          : ""
        : "",
      function: handleAddCheckboxes,
      icon: "add-checkbox-menu-icon",
    },
    {
      title: "Make a copy",
      function: handleMakeCopy,
      icon: "copy-menu-icon",
    },
  ];

  return (
    <>
      <div
        style={{ opacity: !isOpen && "0" }}
        className={`modal-bottom ${!isScrolled ? "bottom-box-shadow" : ""}`}
      >
        <div className="modal-bottom-icons">
          {!localNote?.isTrash ? (
            <>
              <Button className="reminder-icon btn-hover" />
              <Button className="person-add-icon btn-hover" />
              <Button
                className="close archive-icon btn-hover"
                onClick={handleModalArchive}
                onMouseEnter={(e) => showTooltip(e, "Archive")}
                onMouseLeave={hideTooltip}
              />
              <Button
                className="image-icon btn-hover"
                onClick={() => {
                  closeToolTip();
                  inputRef.current.click();
                }}
                onMouseEnter={(e) => showTooltip(e, "Add image")}
                onMouseLeave={hideTooltip}
              >
                <input
                  ref={inputRef}
                  style={{ display: "none" }}
                  type="file"
                  onChange={handleOnChange}
                />
              </Button>
              <Button
                className="color-icon btn-hover"
                onClick={toggleColorMenu}
                onMouseEnter={(e) => showTooltip(e, "Background options")}
                onMouseLeave={hideTooltip}
              />
              <AnimatePresence>
                {colorMenuOpen && (
                  <ColorSelectMenu
                    handleColorClick={handleColorClick}
                    handleBackground={handleBackground}
                    anchorEl={colorAnchorEl}
                    selectedColor={localNote?.color}
                    selectedBG={localNote?.background}
                    isOpen={colorMenuOpen}
                    setIsOpen={setColorMenuOpen}
                  />
                )}
              </AnimatePresence>
              <Button
                onClick={(e) => {
                  closeToolTip();
                  setAnchorEl(e.currentTarget);
                  setMoreMenuOpen((prev) => !prev);
                  setLabelsOpen(false);
                }}
                onMouseEnter={(e) => showTooltip(e, "More")}
                onMouseLeave={hideTooltip}
                className="more-icon btn-hover"
              />
              <>
                <Button
                  onClick={handleUndo}
                  onMouseEnter={(e) => showTooltip(e, "Undo")}
                  onMouseLeave={hideTooltip}
                  disabled={undoStack.length === 0}
                >
                  <BackIcon />
                </Button>
                <Button
                  onClick={handleRedo}
                  onMouseEnter={(e) => showTooltip(e, "Redo")}
                  onMouseLeave={hideTooltip}
                  disabled={redoStack.length === 0}
                >
                  <BackIcon direction="1" />
                </Button>
              </>
            </>
          ) : (
            <>
              <Button
                className="note-delete-icon"
                onMouseEnter={(e) => showTooltip(e, "Delete forever")}
                onMouseLeave={hideTooltip}
                onClick={handleDeleteClick}
              />
              <Button
                className="note-restore-icon"
                onMouseEnter={(e) => showTooltip(e, "Restore")}
                onMouseLeave={hideTooltip}
                onClick={restoreNote}
              />
            </>
          )}
        </div>
        <button
          ref={closeRef}
          onClick={() => setIsOpen(false)}
          className="close close-btn"
        >
          Close
        </button>
      </div>
      <AnimatePresence>
        {moreMenuOpen && !labelsOpen && (
          <MoreMenu
            setIsOpen={setMoreMenuOpen}
            anchorEl={anchorEl}
            isOpen={moreMenuOpen}
            menuItems={menuItems}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {labelsOpen && (
          <ManageModalLabels
            note={note}
            localNote={localNote}
            setLocalNote={setLocalNote}
            isOpen={labelsOpen}
            setIsOpen={setLabelsOpen}
            anchorEl={anchorEl}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteModalOpen && (
          <DeleteModal
            setIsOpen={setDeleteModalOpen}
            handleDelete={handleDeleteNote}
            title="Delete note"
            message={
              <>
                Are you sure you want to delete this note? <br /> this action
                can't be undone.
              </>
            }
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(ModalTools);
