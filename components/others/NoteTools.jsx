import React, { memo, useCallback, useRef, useState } from "react";
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
  images,
  index,
  note = {},
  dispatchNotes,
  colorMenuOpen,
  setColorMenuOpen,
  moreMenuOpen,
  setMoreMenuOpen,
  setFadingNotes,
  setIsLoadingImages,
  userID,
  noteActions,
  setLocalIsTrash,
  openSnackFunction,
  setTooltipAnchor,
}) => {
  const [selectedColor, setSelectedColor] = useState(note.color);
  const [selectedBG, setSelectedBG] = useState(note.background || "DefaultBG");
  const [anchorEl, setAnchorEl] = useState(null);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);

  const inputRef = useRef(null);

  const handleColorClick = useCallback(async (newColor) => {
    closeToolTip();
    noteActions({
      type: "UPDATE_COLOR",
      selectedColor: selectedColor,
      setSelectedColor: setSelectedColor,
      note: note,
      newColor: newColor,
    });
  });

  const handleBackground = useCallback(
    async (newBG) => {
      closeToolTip();
      if (selectedBG === newBG) return;
      setSelectedBG(newBG);

      dispatchNotes({
        type: "UPDATE_BG",
        note: note,
        newBG: newBG,
      });
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction("background", newBG, [note.uuid]);
      window.dispatchEvent(new Event("loadingEnd"));
    },
    [selectedBG]
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
    console.log("img", event.target);
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

    const updatedImages = await NoteUpdateAction(
      "images",
      { url: path, uuid: newUUID },
      [note.uuid]
    );
    await UploadImageAction({ file: file, id: newUUID }, note.uuid);
    // dispatchNotes({
    //   type: "UPDATE_IMAGES",
    //   note: note,
    //   newImages: updatedImages,
    // });
    setIsLoadingImages((prev) => prev.filter((id) => id !== newUUID));
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleMoreClick = useCallback((e) => {
    closeToolTip();
    setAnchorEl(e.currentTarget);
    setMoreMenuOpen((prev) => !prev);
  }, []);

  const handleDeleteNote = async () => {
    noteActions({
      type: "DELETE_NOTE",
      note: note,
      noteRef: note.ref,
    });
  };

  const handleRestoreNote = () => {
    noteActions({
      type: "TRASH_NOTE",
      note: note,
      noteRef: note.ref,
      index: index,
    });
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
      type: "RESTORE_NOTE",
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

  const menuItems = [
    {
      title: "Delete note",
      function: handleTrashNote,
    },
    {
      title: note.labels.length > 0 ? "Change labels" : "Add label",
      function: handleLabels,
    },
    {
      title: "Make a copy",
      function: handleMakeCopy,
    },
  ];

  return (
    <div
      onClick={containerClick}
      style={{
        opacity: images ? "0.8" : "1",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          opacity: (colorMenuOpen || moreMenuOpen) && "1",
        }}
        className={`note-bottom ${images && note.color}`}
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
                onMouseEnter={(e) => handleMouseEnter(e, "Background options")}
                onMouseLeave={handleMouseLeave}
              />
              <AnimatePresence>
                {colorMenuOpen && (
                  <ColorSelectMenu
                    handleColorClick={handleColorClick}
                    handleBackground={handleBackground}
                    anchorEl={colorAnchorEl}
                    selectedColor={selectedColor}
                    selectedBG={selectedBG}
                    setSelectedBG={setSelectedBG}
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
  );
};

export default memo(NoteTools);
