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
  selectedColor,
  setSelectedColor,
  handleClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const colorButtonRef = useRef(null);
  const closeRef = useRef(null);
  const inputRef = useRef(null);

  const handleColorClick = useCallback((color) => {
    if (color === selectedColor) return;
    setSelectedColor(color);
    setNote((prev) => ({ ...prev, color: color }));
  });

  const toggleMenu = useCallback(() => {
    setIsOpen(!isOpen);
  });

  return (
    <div>
      <div style={{ opacity: "1" }} className="modal-bottom">
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
    </div>
  );
};

export default memo(ModalTools);
