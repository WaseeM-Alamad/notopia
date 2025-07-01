import React, { memo, useCallback, useRef, useState } from "react";
import PersonAdd from "../icons/PersonAdd";
import Bell from "../icons/Bell";
import ArchiveIcon from "../icons/ArchiveIcon";
import ImageIcon from "../icons/ImageIcon";
import Button from "../Tools/Button";
import ColorIcon from "../icons/ColorIcon";
import MoreVert from "../icons/MoreVert";
import ColorSelectMenu from "./ColorSelectMenu";
import BackIcon from "../icons/BackIcon";
import { DeleteNoteAction, NoteUpdateAction } from "@/utils/actions";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import ModalMenu from "./ModalMenu";
import ManageLabelsMenu from "./ManageLabelsMenu";
import ManageModalLabels from "./ManageModalLabels";
import DeleteModal from "./DeleteModal";
import { useAppContext } from "@/context/AppContext";

const ModalTools = ({
  localNote,
  isOpen,
  modalOpenRef,
  filters,
  setLocalNote,
  dispatchNotes,
  openSnackFunction,
  delayDispatchRef,
  note,
  noteActions,
  setTooltipAnchor,
  archiveRef,
  trashRef,
  imagesChangedRef,
  setIsOpen,
  undoStack,
  redoStack,
  handleUndo,
  handleRedo,
}) => {
  const { loadingImages, setLoadingImages } = useAppContext();
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const { data: session } = useSession();
  const userID = session?.user?.id;
  const closeRef = useRef(null);
  const inputRef = useRef(null);

  const handleColorClick = useCallback(async (color) => {
    if (color === localNote?.color) return;
    setLocalNote((prev) => ({ ...prev, color: color }));
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction({
      type: "color",
      value: color,
      noteUUIDs: [note.uuid],
    });
    window.dispatchEvent(new Event("loadingEnd"));
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
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "background",
        value: newBG,
        noteUUIDs: [note.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    },
    [localNote?.background]
  );

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
    imagesChangedRef.current = true;
    const file = event.target?.files[0];
    const imageURL = URL.createObjectURL(file);
    const newUUID = uuid();

    setLocalNote((prev) => ({
      ...prev,
      images: [...prev.images, { url: imageURL, uuid: newUUID }],
    }));
    inputRef.current.value = "";
    window.dispatchEvent(new Event("loadingStart"));
    const starter =
      "https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia";
    const path = `${starter}/${userID}/${note.uuid}/${newUUID}`;
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.add(newUUID);
      return newSet;
    });
    const updatedImage = await NoteUpdateAction({
      type: "images",
      value: { url: path, uuid: newUUID },
      noteUUIDs: [note.uuid],
    });

    await UploadImageAction({ file: file, id: newUUID }, note.uuid);
    if (!modalOpenRef.current) {
      dispatchNotes({
        type: "UPDATE_IMAGE",
        note: note,
        newImage: updatedImage,
      });
    } else {
      setLocalNote((prev) => ({
        ...prev,
        images: prev.images.map((img) => {
          if (img.uuid === newUUID) return updatedImage;
          return img;
        }),
      }));
    }

    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(newUUID);
      return newSet;
    });

    window.dispatchEvent(new Event("loadingEnd"));
  };

  const restoreNote = async () => {
    closeToolTip();
    const undo = async () => {
      setLocalNote((prev) => ({ ...prev, isTrash: true }));
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction({
        type: "isTrash",
        value: true,
        noteUUIDs: [localNote.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    const redo = async () => {
      setLocalNote((prev) => ({ ...prev, isTrash: false }));
      window.dispatchEvent(new Event("loadingStart"));

      await NoteUpdateAction({
        type: "isTrash",
        value: false,
        noteUUIDs: [localNote.uuid],
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    redo();

    openSnackFunction({
      snackMessage: "Note restored",
      snackOnUndo: undo,
      snackRedo: redo,
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

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
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
    window.dispatchEvent(new Event("loadingStart"));
    await DeleteNoteAction(localNote.uuid);
    window.dispatchEvent(new Event("loadingEnd"));
  };

  return (
    <>
      <div style={{ opacity: !isOpen && "0" }} className={`modal-bottom`}>
        <div className="modal-bottom-icons">
          {!localNote?.isTrash ? (
            <>
              <Button className="reminder-icon btn-hover" />
              <Button className="person-add-icon btn-hover" />
              <Button
                className="close archive-icon btn-hover"
                onClick={handleModalArchive}
                onMouseEnter={(e) => handleMouseEnter(e, "Archive")}
                onMouseLeave={handleMouseLeave}
              />
              <Button
                className="image-icon btn-hover"
                onClick={() => {
                  closeToolTip();
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
                onClick={toggleColorMenu}
                onMouseEnter={(e) => handleMouseEnter(e, "Background options")}
                onMouseLeave={handleMouseLeave}
              />
              <AnimatePresence>
                {colorMenuOpen && (
                  <ColorSelectMenu
                    handleColorClick={handleColorClick}
                    handleBackground={handleBackground}
                    anchorEl={colorAnchorEl}
                    selectedColor={localNote?.color}
                    selectedBG={localNote?.background}
                    setTooltipAnchor={setTooltipAnchor}
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
                onMouseEnter={(e) => handleMouseEnter(e, "More")}
                onMouseLeave={handleMouseLeave}
                className="more-icon btn-hover"
              />
              <>
                <Button
                  onClick={handleUndo}
                  onMouseEnter={(e) => handleMouseEnter(e, "Undo")}
                  onMouseLeave={handleMouseLeave}
                  disabled={undoStack.length === 0}
                >
                  <BackIcon />
                </Button>
                <Button
                  onClick={handleRedo}
                  onMouseEnter={(e) => handleMouseEnter(e, "Redo")}
                  onMouseLeave={handleMouseLeave}
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
                onMouseEnter={(e) => handleMouseEnter(e, "Delete forever")}
                onMouseLeave={handleMouseLeave}
                onClick={handleDeleteClick}
              />
              <Button
                className="note-restore-icon"
                onMouseEnter={(e) => handleMouseEnter(e, "Restore")}
                onMouseLeave={handleMouseLeave}
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
          <ModalMenu
            setIsOpen={setMoreMenuOpen}
            setModalOpen={setIsOpen}
            anchorEl={anchorEl}
            trashRef={trashRef}
            isOpen={moreMenuOpen}
            setLabelsOpen={setLabelsOpen}
            openSnackFunction={openSnackFunction}
            note={note}
            noteActions={noteActions}
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
