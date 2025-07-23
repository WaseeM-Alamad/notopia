import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { NoteUpdateAction } from "@/utils/actions";
import ColorSelectMenu from "./ColorSelectMenu";
import Button from "../Tools/Button";
import { v4 as uuid } from "uuid";
import MoreMenu from "./MoreMenu";
import { AnimatePresence } from "framer-motion";
import DeleteModal from "./DeleteModal";
import { useAppContext } from "@/context/AppContext";
import ManageLabelsMenu from "./ManageLabelsMenu";
import { useSearch } from "@/context/SearchContext";
import { validateImageFile } from "@/utils/validateImage";

const NoteTools = ({
  index,
  note = {},
  anchorEl,
  setFadingNotes,
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
    showTooltip,
    hideTooltip,
    closeToolTip,
    setLoadingImages,
    openSnackRef,
  } = useAppContext();
  const { filters } = useSearch();
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);

  const isColorFiltered = filters.color;

  const handleColorClick = async (newColor) => {
    closeToolTip();
    if (newColor === note.color && !isColorFiltered) return;
    setSelectedColor(newColor);

    if (!isColorFiltered) {
      dispatchNotes({
        type: "UPDATE_COLOR",
        note: note,
        newColor: newColor,
      });
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "color",
        value: newColor,
        noteUUIDs: [note.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    } else {
      noteActions({
        type: "COLOR",
        note: note,
        newColor: newColor,
      });
      if (newColor !== selectedColor) {
        window.dispatchEvent(new Event("loadingStart"));
        await NoteUpdateAction({
          type: "color",
          value: newColor,
          noteUUIDs: [note.uuid],
        });
        window.dispatchEvent(new Event("loadingEnd"));
      }
    }
  };

  useEffect(() => {
    if (!isColorFiltered) return;

    const handler = async () => {
      if (!colorMenuOpen && selectedColor !== note.color) {
        noteActions({
          type: "COLOR",
          note: note,
          newColor: selectedColor,
          isUseEffectCall: true,
        });
        window.dispatchEvent(new Event("loadingStart"));
        await NoteUpdateAction({
          type: "color",
          value: selectedColor,
          noteUUIDs: [note.uuid],
        });
        window.dispatchEvent(new Event("loadingEnd"));
      }
    };

    handler();
  }, [colorMenuOpen]);

  useEffect(() => {
    setSelectedColor(note.color);
  }, [note.color]);

  const handleBackground = useCallback(
    async (newBG) => {
      closeToolTip();
      if (newBG === note.background) return;

      dispatchNotes({
        type: "UPDATE_BG",
        note: note,
        newBG: newBG,
      });
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "background",
        value: newBG,
        noteUUIDs: [note.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    },
    [note.background]
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
      noteRef: note.ref,
    });
  };

  const handleRestoreNote = () => {
    noteActions({
      type: "RESTORE_NOTE",
      note: note,
      noteRef: note.ref,
      index: index,
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
      index: index,
      noteRef: note.ref,
      setIsOpen: setMoreMenuOpen,
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
      noteUUID: note.uuid,
      checkbox: checkbox,
    });
    setMoreMenuOpen(false);

    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction({
      type: "checkboxes",
      operation: "ADD",
      value: checkbox,
      noteUUIDs: [note.uuid],
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleCheckboxVis = async () => {
    dispatchNotes({
      type: "CHECKBOX_VIS",
      noteUUID: note.uuid,
    });
    setMoreMenuOpen(false);
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction({
      type: "showCheckboxes",
      value: !note.showCheckboxes,
      noteUUIDs: [note.uuid],
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const uncheckAllitems = async () => {
    dispatchNotes({
      type: "UNCHECK_ALL",
      noteUUID: note.uuid,
    });
    setMoreMenuOpen(false);
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction({
      type: "checkboxes",
      operation: "UNCHECK_ALL",
      noteUUIDs: [note.uuid],
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const deleteCheckedItems = async () => {
    dispatchNotes({
      type: "DELETE_CHECKED",
      noteUUID: note.uuid,
    });
    setMoreMenuOpen(false);
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction({
      type: "checkboxes",
      operation: "DELETE_CHECKED",
      noteUUIDs: [note.uuid],
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const menuItems = [
    {
      title: !note.isTrash ? "Move to trash" : "",
      function: handleTrashNote,
      icon: "trash-menu-icon",
    },
    {
      title: !note.isTrash
        ? note.labels.length > 0
          ? "Change labels"
          : "Add label"
        : "",
      function: handleLabels,
      icon: "label-menu-icon",
    },
    {
      title: !note.isTrash
        ? note.checkboxes.some((checkbox) => checkbox.isCompleted)
          ? "Uncheck all items"
          : ""
        : "",
      function: uncheckAllitems,
      icon: "uncheck-checkbox-menu-icon",
    },
    {
      title: !note.isTrash
        ? note.checkboxes.some((checkbox) => checkbox.isCompleted)
          ? "Delete checked items"
          : ""
        : "",
      function: deleteCheckedItems,
      icon: "delete-checkbox-menu-icon",
    },
    {
      title: !note.isTrash
        ? note.checkboxes.length > 0
          ? note.showCheckboxes
            ? "Hide checkboxes"
            : "Show checkboxes"
          : ""
        : "",
      function: handleCheckboxVis,
      icon:
        note.checkboxes.length > 0
          ? note.showCheckboxes
            ? "hide-checkbox-menu-icon"
            : "add-checkbox-menu-icon"
          : "",
    },
    {
      title: !note.isTrash
        ? note.checkboxes.length === 0
          ? "Add checkboxes"
          : ""
        : "",
      function: handleAddCheckboxes,
      icon: "add-checkbox-menu-icon",
    },

    {
      title: !note.isTrash ? "Make a copy" : "",
      function: handleMakeCopy,
      icon: "copy-menu-icon",
    },
    {
      title: note.isTrash ? "Restore note" : "",
      function: handleRestoreNote,
    },
    {
      title: note.isTrash ? "Delete note forever" : "",
      function: () => {
        setDeleteModalOpen(true);
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

  return (
    <>
      <div
        onClick={containerClick}
        style={{
          opacity: note.images.length > 0 ? "0.8" : "1",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            opacity: (colorMenuOpen || moreMenuOpen) && "1",
          }}
          className={`note-bottom ${
            note.images.length > 0 &&
            note.labels.length === 0 &&
            !note.title.trim() &&
            !note.content.trim() &&
            (note.checkboxes.length === 0 || !note.showCheckboxes)
              ? note.color
              : ""
          }`}
        >
          {/* <p className="date">{FormattedDate}</p> */}
          <div className="note-bottom-icons">
            {!note.isTrash ? (
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
                />
                <Button
                  tabIndex="0"
                  className={`${
                    note.isArchived ? "unarchive-icon" : "archive-icon"
                  } btn-hover`}
                  onClick={() => {
                    closeToolTip();
                    noteActions({
                      type: "archive",
                      index: index,
                      note: note,
                      noteRef: note.ref,
                    });
                  }}
                  onMouseEnter={(e) =>
                    showTooltip(
                      e,
                      `${note.isArchived ? "Unarchive" : "Archive"}`
                    )
                  }
                  onMouseLeave={hideTooltip}
                  onFocus={(e) =>
                    showTooltip(
                      e,
                      `${note.isArchived ? "Unarchive" : "Archive"}`
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
                      selectedBG={note.background}
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
                  onClick={() => setDeleteModalOpen(true)}
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
                <AnimatePresence>
                  {deleteModalOpen && (
                    <DeleteModal
                      setIsOpen={setDeleteModalOpen}
                      handleDelete={handleDeleteNote}
                      title="Delete note"
                      message={
                        <>
                          Are you sure you want to delete this note? <br /> this
                          action can't be undone.
                        </>
                      }
                    />
                  )}
                </AnimatePresence>
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
