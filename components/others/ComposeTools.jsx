import React, { memo, useCallback, useRef, useState } from "react";
import Button from "../Tools/Button";
import ColorSelectMenu from "./ColorSelectMenu";
import BackIcon from "../icons/BackIcon";
import { v4 as uuid } from "uuid";
import { AnimatePresence } from "framer-motion";
import { validateImageFile } from "@/utils/validateImage";
import { useAppContext } from "@/context/AppContext";

const AddModalTools = ({
  isOpen,
  setIsOpen,
  setNote,
  note,
  selectedColor,
  setSelectedColor,
  redoStack,
  undoStack,
  handleUndo,
  handleRedo,
  setAnchorEl,
  setMoreMenuOpen,
  setLabelsOpen,
  inputRef,
}) => {
  const { showTooltip, hideTooltip, closeToolTip, openSnackRef } = useAppContext();
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [colorAnchorEl, setColorAnchorEl] = useState();
  const colorButtonRef = useRef(null);
  const closeRef = useRef(null);

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

  const handleBackground = useCallback(
    async (newBG) => {
      closeToolTip();
      if (note?.background === newBG) return;
      setNote((prev) => ({ ...prev, background: newBG }));
    },
    [note?.background]
  );

  const handleOnChange = async (event) => {
    const files = Array.from(event.target?.files || []);

    if (files.length === 0) return;

    const imageFiles = [];
    const imageObjs = [];
    let isInvalidFile = false;

    for (const file of files) {
      const { valid } = await validateImageFile(file);
      if (!valid) {
        isInvalidFile = true;
        continue;
      }
      const imageURL = URL.createObjectURL(file);
      const imageUUID = uuid();
      imageFiles.push({ file: file, uuid: imageUUID });
      imageObjs.push({ url: imageURL, uuid: imageUUID });
    }

    if (isInvalidFile) {
      openSnackRef.current({
        snackMessage:
          "Can’t upload this file. We accept GIF, JPEG, JPG, PNG files less than 10MB and 25 megapixels.",
        showUndo: false,
      });
    }

    setNote((prevNote) => {
      return {
        ...prevNote,
        images: imageObjs,
        imageFiles: imageFiles,
      };
    });
    inputRef.current.value = "";
  };

  return (
    <div style={{ opacity: isOpen ? "1" : "0", marginTop: "auto" }} className="modal-bottom">
      {/* <p className="date">{FormattedDate}</p> */}
      <div className="modal-bottom-icons">
        <Button
          className="reminder-icon btn-hover"
          onMouseEnter={(e) => showTooltip(e, "Remind me")}
          onMouseLeave={hideTooltip}
        />
        <Button
          className="person-add-icon btn-hover"
          onMouseEnter={(e) => showTooltip(e, "Collaborator")}
          onMouseLeave={hideTooltip}
        />
        <Button
          className="archive-icon btn-hover"
          onClick={() => {
            const undoArchive = () => {
              setNote((prev) => ({ ...prev, isArchived: !prev.isArchived }));
            };
            openSnackRef.current({
              snackMessage: `${
                note?.isArchived
                  ? "Note will be archived"
                  : "Note will be unarchived"
              }`,
              snackOnUndo: undoArchive,
            });
            setNote((prev) => ({ ...prev, isArchived: !prev.isArchived }));
          }}
          onMouseEnter={(e) => showTooltip(e, "Archive")}
          onMouseLeave={hideTooltip}
        />
        <Button
          className="image-icon btn-hover"
          onMouseEnter={(e) => showTooltip(e, "Add image")}
          onMouseLeave={hideTooltip}
          onClick={() => inputRef.current.click()}
        >
          <input
            ref={inputRef}
            style={{ display: "none" }}
            type="file"
            multiple
            onChange={handleOnChange}
          />
        </Button>
        <Button
          className="color-icon btn-hover"
          onMouseEnter={(e) => showTooltip(e, "Background options")}
          onMouseLeave={hideTooltip}
          ref={colorButtonRef}
          onClick={toggleMenu}
        />
        <AnimatePresence>
          {colorMenuOpen && (
            <ColorSelectMenu
              handleColorClick={handleColorClick}
              handleBackground={handleBackground}
              anchorEl={colorAnchorEl}
              selectedColor={selectedColor}
              isOpen={colorMenuOpen}
              setIsOpen={setColorMenuOpen}
              selectedBG={note?.background}
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
          onMouseEnter={(e) => showTooltip(e, "More")}
          onMouseLeave={hideTooltip}
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
