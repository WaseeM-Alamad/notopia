import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { copyNoteAction, NoteUpdateAction, undoAction } from "@/utils/actions";
import ColorSelectMenu from "./ColorSelectMenu";
import "@/assets/styles/note.css";
import Button from "../Tools/Button";
import { v4 as uuid } from "uuid";
import { createClient } from "@supabase/supabase-js";
import MoreMenu from "./MoreMenu";
import DeleteIcon from "../icons/DeleteIcon";
import RestoreIcon from "../icons/RestoreIcon";
import { AnimatePresence } from "framer-motion";
import DeleteModal from "./DeleteModal";
import { useAppContext } from "@/context/AppContext";
import ManageLabelsMenu from "./ManageLabelsMenu";

const NoteTools = ({
  index,
  note = {},
  isFilteredNote = false,
  anchorEl,
  setAnchorEl,
  selectedColor,
  setSelectedColor,
  dispatchNotes,
  colorMenuOpen,
  setColorMenuOpen,
  moreMenuOpen,
  setMoreMenuOpen,
  setIsLoadingImages,
  userID,
  noteActions,
  setTooltipAnchor,
}) => {
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);

  const inputRef = useRef(null);

  const handleColorClick = async (newColor) => {
    closeToolTip();
    if (newColor === note.color && !isFilteredNote) return;
    setSelectedColor(newColor);

    if (!isFilteredNote) {
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
    if (!isFilteredNote) return;

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

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
  };

  const UploadImageAction = async (image) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
      const bucketName = "notopia";

      const filePath = `${userID}/${note.uuid}/${image.id}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, image.file, {
          cacheControl: "0",
        });

      if (error) {
        console.error("Error uploading file:", error);
      }
    } catch (error) {
      console.log("couldn't upload images", error);
    }
  };

  const handleOnChange = async (event) => {
    const file = event.target?.files[0];
    const imageURL = URL.createObjectURL(file);
    const newUUID = uuid();

    dispatchNotes({
      type: "ADD_IMAGE",
      note: note,
      newImageUUID: newUUID,
      imageURL: imageURL,
    });

    inputRef.current.value = "";
    window.dispatchEvent(new Event("loadingStart"));
    const starter =
      "https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia";
    const path = `${starter}/${userID}/${note.uuid}/${newUUID}`;
    setIsLoadingImages((prev) => [...prev, newUUID]);

    const updatedImages = await NoteUpdateAction({
      type: "images",
      value: { url: path, uuid: newUUID },
      noteUUIDs: [note.uuid],
    });
    await UploadImageAction({ file: file, id: newUUID }, note.uuid);
    dispatchNotes({
      type: "UPDATE_IMAGES",
      note: note,
      newImages: updatedImages,
    });
    setIsLoadingImages((prev) => prev.filter((id) => id !== newUUID));
    window.dispatchEvent(new Event("loadingEnd"));
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
                  className="reminder-icon btn-hover"
                  onMouseEnter={(e) => handleMouseEnter(e, "Remind me")}
                  onMouseLeave={handleMouseLeave}
                />
                <Button
                  className="person-add-icon btn-hover"
                  onMouseEnter={(e) => handleMouseEnter(e, "Collaborator")}
                  onMouseLeave={handleMouseLeave}
                />
                <Button
                  className="archive-icon btn-hover"
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
                    handleMouseEnter(
                      e,
                      `${note.isArchived ? "Unarchive" : "Archive"}`
                    )
                  }
                  onMouseLeave={handleMouseLeave}
                />
                <Button
                  className="image-icon btn-hover"
                  onClick={() => {
                    setTooltipAnchor((prev) => ({
                      ...prev,
                      display: false,
                    }));
                    inputRef.current.click();
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, "Add image")}
                  onMouseLeave={handleMouseLeave}
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
                  onClick={toggleMenu}
                  onMouseEnter={(e) =>
                    handleMouseEnter(e, "Background options")
                  }
                  onMouseLeave={handleMouseLeave}
                />
                <AnimatePresence>
                  {colorMenuOpen && (
                    <ColorSelectMenu
                      handleColorClick={handleColorClick}
                      handleBackground={handleBackground}
                      anchorEl={colorAnchorEl}
                      selectedColor={selectedColor}
                      selectedBG={note.background}
                      setTooltipAnchor={setTooltipAnchor}
                      isOpen={colorMenuOpen}
                      setIsOpen={setColorMenuOpen}
                    />
                  )}
                </AnimatePresence>
                <Button
                  className="more-icon btn-hover"
                  onClick={handleMoreClick}
                  onMouseEnter={(e) => handleMouseEnter(e, "More")}
                  onMouseLeave={handleMouseLeave}
                />
              </>
            ) : (
              <>
                <Button
                  className="note-delete-icon"
                  onClick={() => setDeleteModalOpen(true)}
                />
                <Button
                  className="note-restore-icon"
                  onClick={handleRestoreNote}
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
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(NoteTools);
