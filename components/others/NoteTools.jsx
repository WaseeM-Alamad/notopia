import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  DeleteNoteAction,
  NoteUpdateAction,
  undoAction,
  updateOrderAction,
} from "@/utils/actions";
import ColorSelectMenu from "./ColorSelectMenu";
import "@/assets/styles/note.css";
import PersonAdd from "../icons/PersonAdd";
import ImageIcon from "../icons/ImageIcon";
import ColorIcon from "../icons/ColorIcon";
import ArchiveIcon from "../icons/ArchiveIcon";
import Bell from "../icons/Bell";
import MoreVert from "../icons/MoreVert";
import Button from "../Tools/Button";
import { v4 as uuid } from "uuid";
import { createClient } from "@supabase/supabase-js";
import MoreMenu from "./MoreMenu";
import DeleteIcon from "../icons/DeleteIcon";
import RestoreIcon from "../icons/RestoreIcon";
import { AnimatePresence } from "framer-motion";
import DeleteModal from "./DeleteModal";

const NoteTools = ({
  images,
  index,
  note,
  dispatchNotes,
  colorMenuOpen,
  setColorMenuOpen,
  moreMenuOpen,
  setMoreMenuOpen,
  setIsLoadingImages,
  userID,
  setLocalIsArchived,
  handleArchive,
  setLocalIsTrash,
  setTriggerUndoCopy,
  setIsNoteDeleted,
  openSnackFunction,
  setTooltipAnchor,
}) => {
  const [selectedColor, setSelectedColor] = useState(note.color);
  const [anchorEl, setAnchorEl] = useState(null);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const inputRef = useRef(null);

  const handleColorClick = useCallback(async (newColor) => {
    if (newColor === selectedColor) return;
    setSelectedColor(newColor);

    dispatchNotes({
      type: "UPDATE_COLOR",
      note: note,
      newColor: newColor,
    });

    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction("color", newColor, note.uuid);
    window.dispatchEvent(new Event("loadingEnd"));
  });

  const toggleMenu = (e) => {
    closeToolTip();
    setColorAnchorEl(e.currentTarget);
    setColorMenuOpen(!colorMenuOpen);
  };

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev.text,
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
    console.log("img", event.target)
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
      note.uuid
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
    setIsNoteDeleted(true);
    window.dispatchEvent(new Event("loadingStart"));
    await DeleteNoteAction(note.uuid);
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleRestoreNote = async () => {
    setLocalIsTrash(true);

    const initialIndex = index;
    const undoTrash = async () => {
      dispatchNotes({
        type: "UNDO_TRASH",
        note: note,
        initialIndex: initialIndex,
      });
      setTimeout(() => {
        window.dispatchEvent(new Event("closeModal"));
      }, 0);

      window.dispatchEvent(new Event("loadingStart"));
      await undoAction({
        type: "UNDO_TRASH",
        noteUUID: note.uuid,
        value: true,
        initialIndex: initialIndex,
        endIndex: 0,
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    openSnackFunction({
      snackMessage: "Note restored",
      snackOnUndo: undoTrash,
    });

    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction("isTrash", false, note.uuid);
    window.dispatchEvent(new Event("loadingEnd"));
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

  return (
    <span
    onClick={containerClick}
      style={{
        opacity: images ? "0.8" : "1",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          opacity: (colorMenuOpen || moreMenuOpen) && "1",
          backgroundColor: images && note.color,
        }}
        className="note-bottom"
      >
        {/* <p className="date">{FormattedDate}</p> */}
        <div className="note-bottom-icons">
          {!note.isTrash ? (
            <>
              {" "}
              <Button
                onMouseEnter={(e) => handleMouseEnter(e, "Remind me")}
                onMouseLeave={handleMouseLeave}
              >
                <Bell size={15} opacity={0.9} />
              </Button>
              <Button
                onMouseEnter={(e) => handleMouseEnter(e, "Collaborator")}
                onMouseLeave={handleMouseLeave}
              >
                <PersonAdd size={15} opacity={0.9} />
              </Button>
              <Button
                onClick={() => {
                  closeToolTip();
                  handleArchive();
                }}
                onMouseEnter={(e) =>
                  handleMouseEnter(
                    e,
                    `${note.isArchived ? "Unarchive" : "Archive"}`
                  )
                }
                onMouseLeave={handleMouseLeave}
              >
                <ArchiveIcon size={15} opacity={0.9} color="#212121" />
              </Button>
              <Button
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
                <ImageIcon size={15} opacity={0.9} />
              </Button>
              <Button
                onClick={toggleMenu}
                onMouseEnter={(e) => handleMouseEnter(e, "Background options")}
                onMouseLeave={handleMouseLeave}
              >
                <ColorIcon size={15} opacity={0.9} />
              </Button>
              <AnimatePresence>
                {colorMenuOpen && (
                  <ColorSelectMenu
                    handleColorClick={handleColorClick}
                    anchorEl={colorAnchorEl}
                    selectedColor={selectedColor}
                    setTooltipAnchor={setTooltipAnchor}
                    isOpen={colorMenuOpen}
                    setIsOpen={setColorMenuOpen}
                  />
                )}
              </AnimatePresence>
              <Button
                onClick={handleMoreClick}
                onMouseEnter={(e) => handleMouseEnter(e, "More")}
                onMouseLeave={handleMouseLeave}
              >
                <MoreVert size={15} opacity={0.9} />
              </Button>
              <AnimatePresence>
                {moreMenuOpen && (
                  <MoreMenu
                    setIsOpen={setMoreMenuOpen}
                    dispatchNotes={dispatchNotes}
                    anchorEl={anchorEl}
                    setAnchorEl={setAnchorEl}
                    isOpen={moreMenuOpen}
                    setLocalIsTrash={setLocalIsTrash}
                    setTriggerUndoCopy={setTriggerUndoCopy}
                    openSnackFunction={openSnackFunction}
                    index={index}
                    uuid={note.uuid}
                    note={note}
                  />
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              <Button onClick={() => setDeleteModalOpen(true)}>
                <DeleteIcon size={18} opacity={0.9} />
              </Button>
              <Button onClick={handleRestoreNote}>
                <RestoreIcon size={18} opacity={0.9} />
              </Button>
              <AnimatePresence>
                {deleteModalOpen && (
                  <DeleteModal
                    isOpen={deleteModalOpen}
                    setIsOpen={setDeleteModalOpen}
                    handleDeleteNote={handleDeleteNote}
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </span>
  );
};

export default memo(NoteTools);
