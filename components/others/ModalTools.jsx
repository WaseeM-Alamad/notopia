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
import { v4 as uuid } from "uuid";
import { AnimatePresence } from "framer-motion";

const ModalTools = ({
  setNote,
  note,
  selectedColor,
  setSelectedColor,
  handleClose,
  setTooltipAnchor,
  openSnackFunction,
}) => {
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [colorAnchorEl, setColorAnchorEl] = useState();
  const colorButtonRef = useRef(null);
  const closeRef = useRef(null);
  const inputRef = useRef(null);

  const handleColorClick = (color) => {
    if (color === selectedColor) return;
    setSelectedColor(color);
    setNote((prev) => ({ ...prev, color: color }));
  };

  const toggleMenu = (e) => {
    closeToolTip();
    setColorAnchorEl(e.currentTarget);
    setColorMenuOpen((prev) => !prev);
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
      text: prev.text,
    }));
  };

  return (
    <div>
      <div style={{ opacity: "1" }} className="modal-bottom">
        {/* <p className="date">{FormattedDate}</p> */}
        <div className="modal-bottom-icons">
          <Button
            onMouseEnter={(e) => handleMouseEnter(e, "Remind me")}
            onMouseLeave={handleMouseLeave}
          >
            <Bell size={15} opacity={0.8} />
          </Button>
          <Button
            onMouseEnter={(e) => handleMouseEnter(e, "Collaborator")}
            onMouseLeave={handleMouseLeave}
          >
            <PersonAdd size={15} opacity={0.8} />
          </Button>
          <Button
            onClick={() => {
              const undoArchive = () => {
                setNote((prev) => ({ ...prev, isArchived: !prev.isArchived }));
              };
              openSnackFunction({
                snackMessage: `${
                  note.isArchived
                    ? "Note will be archived"
                    : "Note will be unarchived"
                }`,
                snackOnUndo: undoArchive,
              });
              setNote((prev) => ({ ...prev, isArchived: !prev.isArchived }));
            }}
            onMouseEnter={(e) => handleMouseEnter(e, "Archive")}
            onMouseLeave={handleMouseLeave}
          >
            <ArchiveIcon size={15} opacity={0.8} color="#212121" />
          </Button>
          <Button
            onMouseEnter={(e) => handleMouseEnter(e, "Add image")}
            onMouseLeave={handleMouseLeave}
            onClick={() => inputRef.current.click()}
          >
            <input
              ref={inputRef}
              style={{ display: "none" }}
              type="file"
              onChange={(event) => {
                const file = event.target?.files[0];
                const imageURL = URL.createObjectURL(file);
                setNote((prevNote) => {
                  const newUUID = uuid();
                  return {
                    ...prevNote,
                    images: [
                      ...prevNote.images,
                      { url: imageURL, uuid: newUUID },
                    ],
                    imageFiles: [
                      ...prevNote.imageFiles,
                      { file: file, id: newUUID },
                    ],
                  };
                });
                inputRef.current.value = "";
              }}
            />
            <ImageIcon size={15} opacity={0.8} />
          </Button>
          <Button
            onMouseEnter={(e) => handleMouseEnter(e, "Background options")}
            onMouseLeave={handleMouseLeave}
            ref={colorButtonRef}
            onClick={toggleMenu}
          >
            <ColorIcon size={15} opacity={0.8} />
          </Button>
          <AnimatePresence>
            {colorMenuOpen && (
              <ColorSelectMenu
                handleColorClick={handleColorClick}
                anchorEl={colorAnchorEl}
                setTooltipAnchor={setTooltipAnchor}
                selectedColor={selectedColor}
                isOpen={colorMenuOpen}
                setIsOpen={setColorMenuOpen}
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
    </div>
  );
};

export default memo(ModalTools);
