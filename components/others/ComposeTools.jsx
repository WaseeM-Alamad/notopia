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

const AddModalTools = ({
  isOpen,
  setIsOpen,
  setNote,
  note,
  selectedColor,
  setSelectedColor,
  setTooltipAnchor,
  openSnackFunction,
  redoStack,
  undoStack,
  handleUndo,
  handleRedo,
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
      text: prev?.text,
    }));
  };

  const handleBackground = useCallback(
    async (newBG) => {
      closeToolTip();
      if (note?.background === newBG) return;
      setNote((prev) => ({ ...prev, background: newBG }));
    },
    [note?.background]
  );

  return (
    <div style={{ opacity: isOpen ? "1": "0" }} className="modal-bottom">
      {/* <p className="date">{FormattedDate}</p> */}
      <div className="modal-bottom-icons">
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
        />
        <Button
          className="image-icon btn-hover"
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
                    { file: file, uuid: newUUID },
                  ],
                };
              });
              inputRef.current.value = "";
            }}
          />
        </Button>
        <Button
          className="color-icon btn-hover"
          onMouseEnter={(e) => handleMouseEnter(e, "Background options")}
          onMouseLeave={handleMouseLeave}
          ref={colorButtonRef}
          onClick={toggleMenu}
        />
        <AnimatePresence>
          {colorMenuOpen && (
            <ColorSelectMenu
              handleColorClick={handleColorClick}
              handleBackground={handleBackground}
              anchorEl={colorAnchorEl}
              setTooltipAnchor={setTooltipAnchor}
              selectedColor={selectedColor}
              isOpen={colorMenuOpen}
              setIsOpen={setColorMenuOpen}
              selectedBG={note?.background}
            />
          )}
        </AnimatePresence>
        <Button
          onMouseEnter={(e) => handleMouseEnter(e, "More")}
          onMouseLeave={handleMouseLeave}
          className="more-icon btn-hover"
        />
        <Button onClick={handleUndo} disabled={undoStack.length === 0}>
          <BackIcon />
        </Button>
        <Button onClick={handleRedo} disabled={redoStack.length === 0}>
          <BackIcon direction="1" />
        </Button>
      </div>
      <button
        onClick={() => setIsOpen(false)}
        ref={closeRef}
        className="close-btn"
      >
        Close
      </button>
    </div>
  );
};

export default memo(AddModalTools);
