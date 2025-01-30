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
import { NoteUpdateAction } from "@/utils/actions";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";

const NoteModalTools = ({
  setNotes,
  setLocalImages,
  selectedColor,
  setSelectedColor,
  note,
  handleClose,
  isAtBottom,
  setIsLoadingImages,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const userID = session?.user?.id;
  const colorButtonRef = useRef(null);
  const closeRef = useRef(null);
  const inputRef = useRef(null);

  const handleColorClick = useCallback(async (color) => {
    if (color === selectedColor) return;
    setSelectedColor(color);
    setNotes((prevNotes) =>
      prevNotes.map((mapNote) =>
        mapNote.uuid === note.uuid ? { ...mapNote, color: color } : mapNote
      )
    );
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction("color", color, note.uuid);
    window.dispatchEvent(new Event("loadingEnd"));
  });

  const toggleMenu = useCallback(() => {
    setIsOpen(!isOpen);
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

    setLocalImages((prev) => [...prev, { url: imageURL, uuid: newUUID }]);
    inputRef.current.value = "";
    window.dispatchEvent(new Event("loadingStart"));
    const starter =
      "https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia";
    const path = `${starter}/${userID}/${note.uuid}/${newUUID}`;
    setIsLoadingImages((prev) => [...prev, newUUID]);
    await NoteUpdateAction("images", { url: path, id: newUUID }, note.uuid);
    await UploadImageAction({ file: file, id: newUUID }, note.uuid);
    setIsLoadingImages((prev) => prev.filter((id) => id !== newUUID));
    window.dispatchEvent(new Event("loadingEnd"));
  };

  return (
    <div
      style={{ opacity: "1" }}
      className={`modal-bottom ${!isAtBottom && `bottom-box-shadow`} `}
    >
      {/* <p className="date">{FormattedDate}</p> */}
      <div className="modal-bottom-icons">
        <Button>
          <Bell size={15} opacity={0.8} />
        </Button>
        <Button>
          <PersonAdd size={15} opacity={0.8} />
        </Button>
        <Button>
          <ArchiveIcon size={15} opacity={0.8} color="#212121" />
        </Button>
        <Button onClick={() => inputRef.current.click()}>
          <input
            ref={inputRef}
            style={{ display: "none" }}
            type="file"
            onChange={handleOnChange}
          />
          <ImageIcon size={15} opacity={0.8} />
        </Button>
        <Button ref={colorButtonRef} onClick={toggleMenu}>
          <ColorIcon size={15} opacity={0.8} />
        </Button>
        <AnimatePresence>
          {isOpen && (
            <ColorSelectMenu
              handleColorClick={handleColorClick}
              selectedColor={selectedColor}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              buttonRef={colorButtonRef}
            />
          )}
        </AnimatePresence>
        <Button>
          <MoreVert size={15} opacity={0.8} />
        </Button>
        <Button>
          <BackIcon size={15} opacity={0.8} />
        </Button>
        <Button>
          <BackIcon size={15} opacity={0.8} direction="1" />
        </Button>
      </div>
      <button
        ref={closeRef}
        onClick={(e) => handleClose(e, closeRef)}
        className="close-btn"
      >
        Close
      </button>
    </div>
  );
};

export default memo(NoteModalTools);
