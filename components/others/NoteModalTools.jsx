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

const NoteModalTools = ({
  setNotes,
  selectedColor,
  setSelectedColor,
  note,
  handleClose,
  isAtBottom,
}) => {
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isOpen, setIsOpen] = useState(false);
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
    setTimeout(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    }, 800);
  });

  const toggleMenu = useCallback(() => {
    const rect = colorButtonRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY, // Account for scrolling
      left: rect.left + window.scrollX, // Account for scrolling
    });
    setIsOpen(!isOpen);
  });

  return (
      <div style={{ opacity: "1" }} className={`modal-bottom ${!isAtBottom && `bottom-box-shadow`} `}>
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
            />
            <ImageIcon size={15} opacity={0.8} />
          </Button>
          <Button ref={colorButtonRef} onClick={toggleMenu}>
            <ColorIcon size={15} opacity={0.8} />
          </Button>
          <ColorSelectMenu
            handleColorClick={handleColorClick}
            menuPosition={menuPosition}
            selectedColor={selectedColor}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            buttonRef={colorButtonRef}
          />
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

export default memo (NoteModalTools);
