import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { NoteUpdateAction, removeSelfAction } from "@/utils/actions";
import ColorSelectMenu from "./ColorSelectMenu";
import Button from "../Tools/Button";
import { v4 as uuid } from "uuid";
import MoreMenu from "./MoreMenu";
import { AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import ManageLabelsMenu from "./ManageLabelsMenu";
import { useSearch } from "@/context/SearchContext";
import { validateImageFile } from "@/utils/validateImage";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";

const NoteTools = ({
  note = {},
  anchorEl,
  handleNoteClick,
  setAnchorEl,
  selectedColor,
  setSelectedColor,
  dispatchNotes,
  colorMenuOpen,
  setColorMenuOpen,
  moreMenuOpen,
  setMoreMenuOpen,
  userID,
  noteActions,
  inputRef,
}) => {
  const {
    clientID,
    showTooltip,
    hideTooltip,
    closeToolTip,
    setLoadingImages,
    setDialogInfoRef,
    notesIndexMapRef,
    openSnackRef,
    notesStateRef,
  } = useAppContext();
  const { filters } = useSearch();
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [labelsOpen, setLabelsOpen] = useState(false);

  const ImagesWithNoBottomContent =
    note?.images?.length > 0 &&
    note?.labels?.length === 0 &&
    note?.collaborators?.length === 0 &&
    !note?.title.trim() &&
    !note?.content.trim() &&
    (note?.checkboxes?.length === 0 || !note?.showCheckboxes);

  const isColorFiltered = filters.color;

  const handleColorClick = async (newColor) => {
    closeToolTip();
    if (newColor === note?.color && !isColorFiltered) return;
    setSelectedColor(newColor);

    if (!isColorFiltered) {
      dispatchNotes({
        type: "UPDATE_COLOR",
        note: note,
        newColor: newColor,
      });

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "color",
              value: newColor,
              noteUUIDs: [note?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    } else {
      noteActions({
        type: "COLOR",
        note: note,
        newColor: newColor,
      });
      if (newColor !== selectedColor) {
        handleServerCall(
          [
            () =>
              NoteUpdateAction({
                type: "color",
                value: newColor,
                noteUUIDs: [note?.uuid],
                clientID: clientID,
              }),
          ],
          openSnackRef.current
        );
      }
    }
    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "UPDATE_COLOR",
      note: note,
      newColor: newColor,
    });
  };

  useEffect(() => {
    if (!isColorFiltered) return;

    const handler = async () => {
      if (!colorMenuOpen && selectedColor !== note?.color) {
        noteActions({
          type: "COLOR",
          note: note,
          newColor: selectedColor,
          isUseEffectCall: true,
        });

        handleServerCall(
          [
            () =>
              NoteUpdateAction({
                type: "color",
                value: selectedColor,
                noteUUIDs: [note?.uuid],
                clientID: clientID,
              }),
          ],
          openSnackRef.current
        );
      }
    };

    handler();
  }, [colorMenuOpen]);

  useEffect(() => {
    setSelectedColor(note?.color);
  }, [note?.color]);

  const handleBackground = useCallback(
    async (newBG) => {
      closeToolTip();
      if (newBG === note?.background) return;

      dispatchNotes({
        type: "UPDATE_BG",
        note: note,
        newBG: newBG,
      });

      handleServerCall(
        [
          () =>
            NoteUpdateAction({
              type: "background",
              value: newBG,
              noteUUIDs: [note?.uuid],
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "UPDATE_BG",
        note: note,
        newBG: newBG,
      });
    },
    [note?.background]
  );

  const toggleMenu = (e) => {
    closeToolTip();
    setColorAnchorEl(e.currentTarget);
    setColorMenuOpen(!colorMenuOpen);
  };

  const handleOnChange = async (event) => {
    const formData = new FormData();
    const files = Array.from(event.target?.files || []);

    if (files.length === 0) return;

    const imageUUIDs = [];
    const newImages = [];
    let isInvalidFile = false;
    let invalidCount = 0;

    formData.append("noteUUID", note?.uuid);

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

    dispatchNotes({
      type: "ADD_IMAGES",
      note: note,
      newImages: newImages,
    });

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

    if (!data.error) {
      const updatedImages = data;
      const imagesMap = new Map();
      updatedImages.forEach((imageData) => {
        imagesMap.set(imageData.uuid, imageData);
      });
      dispatchNotes({
        type: "UPDATE_IMAGES",
        note: note,
        imagesMap: imagesMap,
      });
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "UPDATE_IMAGES",
        note: note,
        imagesMap: imagesMap,
      });
    } else {
      openSnackRef.current({
        snackMessage: "Error uploading images",
        showUndo: false,
      });
    }
  };

  const handleMoreClick = (e) => {
    closeToolTip();

    // Get button's rect relative to viewport at click
    const rect = e.currentTarget.getBoundingClientRect();

    // Convert to absolute page coordinates (scroll + viewport)
    const pageX = rect.left + window.pageXOffset;
    const pageY = rect.top + window.pageYOffset;

    const virtualAnchor = {
      getBoundingClientRect: () =>
        // Calculate rect relative to viewport on each call by subtracting current scroll
        new DOMRect(
          pageX - window.pageXOffset,
          pageY - window.pageYOffset,
          rect.width,
          rect.height
        ),
      contextElement: document.body,
    };

    setAnchorEl({ ...virtualAnchor, btnRef: e.currentTarget });
    setMoreMenuOpen((prev) => !prev);
  };

  const handleDeleteNote = async () => {
    noteActions({
      type: "DELETE_NOTE",
      note: note,
      noteRef: note?.ref,
    });
  };

  const handleRestoreNote = () => {
    noteActions({
      type: "RESTORE_NOTE",
      note: note,
      noteRef: note?.ref,
      index: notesIndexMapRef.current.get(note.uuid),
    });
    setMoreMenuOpen(false);
  };

  const containerClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleTrashNote = async (e) => {
    noteActions({
      type: "TRASH_NOTE",
      note: note,
      index: notesIndexMapRef.current.get(note.uuid),
      noteRef: note?.ref,
      setIsOpen: setMoreMenuOpen,
    });
  };

  const handleRemoveSelf = () => {
    setMoreMenuOpen(false);
    const func = () => {
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "DELETE_NOTE",
        note: note,
      });
      dispatchNotes({
        type: "DELETE_NOTE",
        note: note,
      });
      handleServerCall(
        [() => removeSelfAction(note?.uuid, clientID)],
        openSnackRef.current
      );
    };
    setDialogInfoRef.current({
      func: func,
      title: "Remove note?",
      message: "This note will no longer be shared with you.",
      btnMsg: "Remove",
    });
  };

  const handleMakeCopy = async () => {
    noteActions({
      type: "COPY_NOTE",
      setMoreMenuOpen: setMoreMenuOpen,
      note: note,
    });
  };

  const handleLabels = () => {
    setLabelsOpen(true);
    setMoreMenuOpen(false);
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
    dispatchNotes({
      type: "ADD_CHECKBOX",
      noteUUID: note?.uuid,
      checkbox: checkbox,
    });
    setMoreMenuOpen(false);

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "checkboxes",
            operation: "ADD",
            value: checkbox,
            noteUUIDs: [note?.uuid],
            clientID: clientID,
          }),
      ],
      openSnackRef.current
    );
    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "ADD_CHECKBOX",
      noteUUID: note?.uuid,
      checkbox: checkbox,
    });
  };

  const handleCheckboxVis = async () => {
    dispatchNotes({
      type: "CHECKBOX_VIS",
      noteUUID: note?.uuid,
    });
    setMoreMenuOpen(false);

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "showCheckboxes",
            value: !note?.showCheckboxes,
            noteUUIDs: [note?.uuid],
            clientID: clientID,
          }),
      ],
      openSnackRef.current
    );
    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "CHECKBOX_VIS",
      noteUUID: note?.uuid,
    });
  };

  const uncheckAllitems = async () => {
    dispatchNotes({
      type: "UNCHECK_ALL",
      noteUUID: note?.uuid,
    });
    setMoreMenuOpen(false);

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "checkboxes",
            operation: "UNCHECK_ALL",
            noteUUIDs: [note?.uuid],
            clientID: clientID,
          }),
      ],
      openSnackRef.current
    );
    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "UNCHECK_ALL",
      noteUUID: note?.uuid,
    });
  };

  const deleteCheckedItems = async () => {
    dispatchNotes({
      type: "DELETE_CHECKED",
      noteUUID: note?.uuid,
    });
    setMoreMenuOpen(false);

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "checkboxes",
            operation: "DELETE_CHECKED",
            noteUUIDs: [note?.uuid],
            clientID: clientID,
          }),
      ],
      openSnackRef.current
    );
    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "DELETE_CHECKED",
      noteUUID: note?.uuid,
    });
  };

  const menuItems = [
    {
      title: !note?.isTrash
        ? note?.creator?.id === userID
          ? "Move to trash"
          : "Remove myself"
        : "",
      function:
        note?.creator?.id === userID ? handleTrashNote : handleRemoveSelf,
      icon: "trash-menu-icon",
    },
    {
      title: !note?.isTrash
        ? note?.labels?.length > 0
          ? "Change labels"
          : "Add label"
        : "",
      function: handleLabels,
      icon: "label-menu-icon",
    },
    {
      title: !note?.isTrash
        ? note?.checkboxes?.some((checkbox) => checkbox.isCompleted)
          ? "Uncheck all items"
          : ""
        : "",
      function: uncheckAllitems,
      icon: "uncheck-checkbox-menu-icon",
    },
    {
      title: !note?.isTrash
        ? note?.checkboxes?.some((checkbox) => checkbox.isCompleted)
          ? "Delete checked items"
          : ""
        : "",
      function: deleteCheckedItems,
      icon: "delete-checkbox-menu-icon",
    },
    {
      title: !note?.isTrash
        ? note?.checkboxes?.length > 0
          ? note?.showCheckboxes
            ? "Hide checkboxes"
            : "Show checkboxes"
          : ""
        : "",
      function: handleCheckboxVis,
      icon:
        note?.checkboxes?.length > 0
          ? note?.showCheckboxes
            ? "hide-checkbox-menu-icon"
            : "add-checkbox-menu-icon"
          : "",
    },
    {
      title: !note?.isTrash
        ? note?.checkboxes?.length === 0
          ? "Add checkboxes"
          : ""
        : "",
      function: handleAddCheckboxes,
      icon: "add-checkbox-menu-icon",
    },

    {
      title: !note?.isTrash ? "Make a copy" : "",
      function: handleMakeCopy,
      icon: "copy-menu-icon",
    },
    {
      title: note?.isTrash ? "Restore note" : "",
      function: handleRestoreNote,
    },
    {
      title: note?.isTrash ? "Delete note forever" : "",
      function: () => {
        setDialogInfoRef.current({
          func: handleDeleteNote,
          title: "Delete note",
          message: (
            <>
              Are you sure you want to delete this note? <br /> this action
              can't be undone.
            </>
          ),

          btnMsg: "Delete",
        });
        setMoreMenuOpen(false);
      },
    },
  ];

  const removedFilteredLabelRef = useRef(null);

  useEffect(() => {
    if (labelsOpen || !removedFilteredLabelRef.current) return;
    noteActions({
      type: "REMOVE_FILTERED_LABEL",
      note: note,
      labelUUID: removedFilteredLabelRef.current,
    });
  }, [labelsOpen]);

  const handleCollab = () => {
    closeToolTip();
    const element = note?.ref.current.parentElement;
    handleNoteClick(
      { currentTarget: element },
      note,
      notesIndexMapRef.current.get(note.uuid),
      true
    );
  };

  return (
    <>
      <div
        onClick={containerClick}
        style={{
          opacity: ImagesWithNoBottomContent ? "0.8" : "1",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            opacity: (colorMenuOpen || moreMenuOpen) && "1",
          }}
          className={`note-bottom ${
            ImagesWithNoBottomContent ? note?.color : ""
          }`}
        >
          {/* <p className="date">{FormattedDate}</p> */}
          <div className="note-bottom-icons">
            {!note?.isTrash ? (
              <>
                <Button
                  tabIndex="0"
                  className="reminder-icon btn-hover"
                  onMouseEnter={(e) => showTooltip(e, "Remind me")}
                  onMouseLeave={hideTooltip}
                  onFocus={(e) => showTooltip(e, "Remind me")}
                  onBlur={hideTooltip}
                />
                <Button
                  tabIndex="0"
                  className="person-add-icon btn-hover"
                  onMouseEnter={(e) => showTooltip(e, "Collaborator")}
                  onMouseLeave={hideTooltip}
                  onFocus={(e) => showTooltip(e, "Collaborator")}
                  onBlur={hideTooltip}
                  onClick={handleCollab}
                />
                <Button
                  tabIndex="0"
                  className={`${
                    note?.isArchived ? "unarchive-icon" : "archive-icon"
                  } btn-hover`}
                  onClick={() => {
                    closeToolTip();
                    noteActions({
                      type: "archive",
                      index: notesIndexMapRef.current.get(note.uuid),
                      note: note,
                      noteRef: note?.ref,
                    });
                  }}
                  onMouseEnter={(e) =>
                    showTooltip(
                      e,
                      `${note?.isArchived ? "Unarchive" : "Archive"}`
                    )
                  }
                  onMouseLeave={hideTooltip}
                  onFocus={(e) =>
                    showTooltip(
                      e,
                      `${note?.isArchived ? "Unarchive" : "Archive"}`
                    )
                  }
                  onBlur={hideTooltip}
                />
                <Button
                  tabIndex="0"
                  className="image-icon btn-hover"
                  onClick={() => {
                    closeToolTip();
                    inputRef.current.click();
                  }}
                  onMouseEnter={(e) => showTooltip(e, "Add image")}
                  onMouseLeave={hideTooltip}
                  onFocus={(e) => showTooltip(e, "Add image")}
                  onBlur={hideTooltip}
                >
                  <input
                    ref={inputRef}
                    style={{ display: "none" }}
                    type="file"
                    multiple
                    onChange={handleOnChange}
                  />
                </Button>
                <Button
                  tabIndex="0"
                  className="color-icon btn-hover"
                  onClick={toggleMenu}
                  onMouseEnter={(e) => showTooltip(e, "Background options")}
                  onMouseLeave={hideTooltip}
                  onFocus={(e) => showTooltip(e, "Background options")}
                  onBlur={hideTooltip}
                />
                <AnimatePresence>
                  {colorMenuOpen && (
                    <ColorSelectMenu
                      handleColorClick={handleColorClick}
                      handleBackground={handleBackground}
                      anchorEl={colorAnchorEl}
                      selectedColor={selectedColor}
                      selectedBG={note?.background}
                      isOpen={colorMenuOpen}
                      setIsOpen={setColorMenuOpen}
                    />
                  )}
                </AnimatePresence>
                <Button
                  tabIndex="0"
                  className="more-icon btn-hover"
                  onClick={handleMoreClick}
                  onMouseEnter={(e) => showTooltip(e, "More")}
                  onMouseLeave={hideTooltip}
                  onFocus={(e) => showTooltip(e, "More")}
                  onBlur={hideTooltip}
                />
              </>
            ) : (
              <>
                <Button
                  tabIndex="0"
                  className="note-delete-icon"
                  onClick={() =>
                    setDialogInfoRef.current({
                      func: handleDeleteNote,
                      title: "Delete note",
                      message: (
                        <>
                          Are you sure you want to delete this note? <br /> this
                          action can't be undone.
                        </>
                      ),

                      btnMsg: "Delete",
                    })
                  }
                  onMouseEnter={(e) => showTooltip(e, "Delete forever")}
                  onMouseLeave={hideTooltip}
                  onFocus={(e) => showTooltip(e, "Delete forever")}
                  onBlur={hideTooltip}
                />
                <Button
                  tabIndex="0"
                  className="note-restore-icon"
                  onClick={handleRestoreNote}
                  onMouseEnter={(e) => showTooltip(e, "Restore")}
                  onMouseLeave={hideTooltip}
                  onFocus={(e) => showTooltip(e, "Restore")}
                  onBlur={hideTooltip}
                />
              </>
            )}
          </div>
        </div>
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
          <ManageLabelsMenu
            dispatchNotes={dispatchNotes}
            note={note}
            isOpen={labelsOpen}
            setIsOpen={setLabelsOpen}
            anchorEl={anchorEl}
            removedFilteredLabelRef={removedFilteredLabelRef}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(NoteTools);
