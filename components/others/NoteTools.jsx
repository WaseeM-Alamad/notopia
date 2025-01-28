import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { DeleteNoteAction, NoteUpdateAction } from "@/utils/actions";
import ColorSelectMenu from "./ColorSelectMenu";
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
import { AnimatePresence, motion } from "framer-motion";

const NoteTools = ({
  images,
  setNotes,
  note,
  colorMenuOpen,
  setColorMenuOpen,
  setIsLoadingImages,
  userID,
  setLocalIsArchived,
  setLocalIsTrash,
  setIsNoteDeleted,
}) => {
  const [selectedColor, setSelectedColor] = useState(note.color);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const colorButtonRef = useRef(null);
  const colorMenuRef = useRef(null);
  const inputRef = useRef(null);
  const moreRef = useRef(null);

  const handleColorClick = useCallback(async (color) => {
    if (color === selectedColor) return;
    setSelectedColor(color);
    // setNote((prev) => ({ ...prev, color: color }));
    setNotes((prevNotes) =>
      prevNotes.map((mapNote) =>
        mapNote.uuid === note.uuid ? { ...mapNote, color: color } : mapNote
      )
    );
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction("color", color, note.uuid);
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);
  });

  const [colorMenuPosition, setColorMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const [moreMenuPosition, setMoreMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const toggleMenu = () => {
    // const rect = colorButtonRef.current.getBoundingClientRect();
    // const menuRect = colorMenuRef.current.getBoundingClientRect();
    // console.log("left", menuRect.left)
    // setColorMenuPosition({
    //   top: rect.bottom + window.scrollY, // Account for scrolling
    //   left: rect.left + window.scrollX, // Account for scrolling
    // });
    setColorMenuOpen(!colorMenuOpen);
  };

  const handleArchive = useCallback(async () => {
    setLocalIsArchived((prev) => !prev);
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction("isArchived", !note.isArchived, note.uuid);
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);
  });

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
    setNotes((prevNotes) =>
      prevNotes.map((mapNote) =>
        mapNote.uuid === note.uuid
          ? {
              ...mapNote,
              images: [...mapNote.images, { url: imageURL, uuid: newUUID }],
            }
          : mapNote
      )
    );
    inputRef.current.value = "";
    window.dispatchEvent(new Event("loadingStart"));
    const starter =
      "https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia";
    const path = `${starter}/${userID}/${note.uuid}/${newUUID}`;
    setIsLoadingImages((prev) => [...prev, newUUID]);
    await NoteUpdateAction("images", { url: path, uuid: newUUID }, note.uuid);
    await UploadImageAction({ file: file, id: newUUID }, note.uuid);
    setIsLoadingImages((prev) => prev.filter((id) => id !== newUUID));
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);
  };

  const handleMoreClick = useCallback(() => {
    const rect = moreRef.current?.getBoundingClientRect();
    setMoreMenuPosition({
      top: rect.top,
      left: rect.left,
    });
    setMoreMenuOpen((prev) => !prev);
  }, []);

  const handleDeleteNote = async () => {
    setIsNoteDeleted(true);
    window.dispatchEvent(new Event("loadingStart"));
    await DeleteNoteAction(note.uuid);
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);
  };

  const handleRestoreNote = async () => {
    setLocalIsTrash(true);
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction("isTrash", false, note.uuid);
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);
  };

  return (
    <span
      style={{
        opacity: images ? "0.8" : "1",
        transition: "all 0.3s ease",
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
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
              <Button>
                <Bell size={15} opacity={0.9} />
              </Button>
              <Button>
                <PersonAdd size={15} opacity={0.9} />
              </Button>
              <Button onClick={handleArchive}>
                <ArchiveIcon size={15} opacity={0.9} color="#212121" />
              </Button>
              <Button onClick={() => inputRef.current.click()}>
                <input
                  ref={inputRef}
                  style={{ display: "none" }}
                  type="file"
                  onChange={handleOnChange}
                />
                <ImageIcon size={15} opacity={0.9} />
              </Button>
              <Button ref={colorButtonRef} onClick={toggleMenu}>
                <ColorIcon size={15} opacity={0.9} />
              </Button>
              <AnimatePresence>
                {colorMenuOpen && (
                  <ColorSelectMenu
                    handleColorClick={handleColorClick}
                    menuPosition={colorMenuPosition}
                    selectedColor={selectedColor}
                    isOpen={colorMenuOpen}
                    setIsOpen={setColorMenuOpen}
                    buttonRef={colorButtonRef}
                    colorMenuRef={colorMenuRef}
                  />
                )}
              </AnimatePresence>
              <Button onClick={handleMoreClick} ref={moreRef}>
                <MoreVert size={15} opacity={0.9} />
              </Button>
              <MoreMenu
                setIsOpen={setMoreMenuOpen}
                buttonRef={moreRef}
                menuPosition={moreMenuPosition}
                isOpen={moreMenuOpen}
                setLocalIsTrash={setLocalIsTrash}
                uuid={note.uuid}
                note={note}
                setNotes={setNotes}
              />
            </>
          ) : (
            <>
              <Button onClick={handleDeleteNote} ref={moreRef}>
                <DeleteIcon size={18} opacity={0.9} />
              </Button>
              <Button onClick={handleRestoreNote} ref={moreRef}>
                <RestoreIcon size={18} opacity={0.9} />
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </span>
  );
};

export default memo(NoteTools);
