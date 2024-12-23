import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { NoteUpdateAction } from "@/utils/actions";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import { format } from "date-fns";
import ColorSelectMenu from "./ColorSelectMenu";
import PersonAdd from "./icons/PersonAdd";
import ImageIcon from "./icons/ImageIcon";
import ColorIcon from "./icons/ColorIcon";
import ArchiveIcon from "./icons/ArchiveIcon";
import Bell from "./icons/Bell";
import MoreVert from "./icons/MoreVert";
import Button from "./Tools/Button";

const NoteTools = ({ setNote, noteVals, isOpen, setIsOpen }) => {
  const [selectedColor, setSelectedColor] = useState(noteVals.color);

  const colorButtonRef = useRef(null);
  const FormattedDate = noteVals.createdAt
    ? getNoteFormattedDate(noteVals.createdAt)
    : format(new Date(), "h:mm a");

  const handleColorClick = useCallback(async (color) => {
    if (color === selectedColor) return;
      setSelectedColor(color);
      setNote((prev) => ({ ...prev, color: color }));
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction("color", color, noteVals.uuid);
      setTimeout(() => {
        window.dispatchEvent(new Event("loadingEnd"));
      }, 800);
  });

  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const toggleMenu = () => {
    const rect = colorButtonRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY, // Account for scrolling
      left: rect.left + window.scrollX, // Account for scrolling
    });
    setIsOpen(!isOpen);
  };

  return (
    <div style={{ opacity: isOpen && "1" }} className="note-bottom">
      {/* <p className="date">{FormattedDate}</p> */}
      <div className="note-bottom-icons">
        <Button >
          <Bell size={16} opacity={0.9} />
        </Button>
        <Button >
          <PersonAdd size={16} opacity={0.9} />
        </Button>
        <Button >
          <ArchiveIcon size={16} opacity={0.9} color="#212121" />
        </Button>
        <Button >
          <ImageIcon size={16} opacity={0.9} />
        </Button>
        <Button
          ref={colorButtonRef}
          onClick={toggleMenu}
          
        >
          <ColorIcon size={16} opacity={0.9} />
        </Button>
        <ColorSelectMenu
          handleColorClick={handleColorClick}
          menuPosition={menuPosition}
          selectedColor={selectedColor}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          buttonRef={colorButtonRef}
        />
        <Button >
          <MoreVert size={16} opacity={0.9} />
        </Button>
      </div>
    </div>
  );
};

export default memo(NoteTools);
