import Button from "@/components/Tools/Button";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import ColorSelectMenu from "../ColorSelectMenu";
import { batchUpdateAction, NoteUpdateAction } from "@/utils/actions";

const TopMenuHome = ({
  notes,
  dispatchNotes,
  selectedNotesIDs,
  setSelectedNotesIDs,
  setTooltipAnchor,
}) => {
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [selectedBG, setSelectedBG] = useState(null);
  const [selectedColor, setSelectedColor] = useState();
  const topMenuRef = useRef(null);

  const handleClose = () => {
    closeToolTip();
    setSelectedNotesIDs([]);
    window.dispatchEvent(new Event("topMenuClose"));
  };

  useEffect(() => {
    if (
      selectedNotesIDs.length > 0 &&
      !document
        .querySelector(".starting-div")
        .classList.contains("selected-notes")
    ) {
      document.querySelector(".starting-div").classList.add("selected-notes");
    }

    if (selectedNotesIDs.length === 0) {
      document
        .querySelector(".starting-div")
        .classList.remove("selected-notes");
    }

    const handler = (e) => {
      if (
        selectedNotesIDs.length > 0 &&
        !e.target.closest(".note") &&
        !e.target.closest("nav") &&
        !e.target.closest(".top-menu") &&
        !e.target.closest("aside") &&
        !e.target.closest(".color-menu") &&
        !document
          .querySelector(".starting-div")
          .classList.contains("dragging")
      ) {
        handleClose();
      }
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  }, [selectedNotesIDs]);

  useEffect(() => {
    const length = selectedNotesIDs.length;

    if (length === 0) {
      return;
    } else {
      let sharedColor = new Set();
      let sharedBG = new Set();
      selectedNotesIDs.forEach((noteData) => {
        const note = notes.get(noteData.uuid);
        const color = note.color;
        const bg = note.background;
        sharedColor.add(color);
        sharedBG.add(bg);
      });
      if (sharedColor.size === 1) {
        setSelectedColor([...sharedColor][0]);
      } else {
        setSelectedColor(null);
      }

      if (sharedBG.size === 1) {
        setSelectedBG([...sharedBG][0]);
      } else {
        setSelectedBG(null);
      }
    }
  }, [selectedNotesIDs.length]);

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

  const handleOpenColor = (e) => {
    setColorAnchorEl(e.currentTarget);
    setColorMenuOpen((prev) => !prev);
  };

  const handleColorClick = async (newColor) => {
    if (selectedColor === newColor) return;
    dispatchNotes({
      type: "BATCH_UPDATE_COLOR",
      selectedNotes: selectedNotesIDs,
      color: newColor,
    });
    setSelectedColor(newColor);
    const UUIDS = selectedNotesIDs.map((data) => data.uuid);
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction("color", newColor, UUIDS);
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleBackground = async (newBG) => {
    if (selectedBG === newBG) return;
    dispatchNotes({
      type: "BATCH_UPDATE_BG",
      selectedNotes: selectedNotesIDs,
      background: newBG,
    });
    setSelectedBG(newBG);
    const UUIDS = selectedNotesIDs.map((data) => data.uuid);
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction("background", newBG, UUIDS);
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleArchive = async () => {
    // const firstItem = selectedNotesIDs[0];
    // const val = notes.get(firstItem.uuid).isArchived;

    // dispatchNotes({
    //   type: "BATCH_ARCHIVE",
    //   selectedNotes: selectedNotesIDs,
    //   isArchived: val,
    // });
    // setSelectedNotesIDs([])
    // window.dispatchEvent(new Event("loadingStart"));

    const container = document.body.querySelector(".section-container");
    console.log(Array.from(container.children))


    // await batchUpdateAction({
    //   type: "BATCH_ARCHIVE",
    //   selectedNotes: selectedNotesIDs,
    //   val: val,
    // });
    // window.dispatchEvent(new Event("loadingEnd"));
  };

  return (
    <>
      <AnimatePresence>
        {selectedNotesIDs.length > 0 && (
          <motion.div
            ref={topMenuRef}
            className="top-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: selectedNotesIDs.length > 0 ? 1 : 0,
              y: selectedNotesIDs.length > 0 ? 0 : -20,
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              opacity: { duration: 0.2, ease: "easeIn" },
              y: { duration: 0.3, stiffness: 120, damping: 20 },
            }}
          >
            <Button
              onClick={handleClose}
              onMouseEnter={(e) => handleMouseEnter(e, "Clear selection")}
              onMouseLeave={handleMouseLeave}
              className="clear-icon"
              style={{
                display: "flex",
                width: "52px",
                height: "52px",
                margin: "0 0.9rem 0 0.8rem",
              }}
            />
            <span>{selectedNotesIDs.length} Selected</span>
            <div className="top-menu-tools">
              <Button
                className="top-pin-icon"
                style={{ width: "45px", height: "45px" }}
              />
              <Button
                className="top-reminder-icon"
                style={{ width: "45px", height: "45px" }}
              />
              <Button
                onClick={handleArchive}
                className="top-archive-icon"
                style={{ width: "45px", height: "45px" }}
              />
              <Button
                onClick={handleOpenColor}
                className="top-color-icon"
                style={{ width: "45px", height: "45px" }}
              />
              <Button
                className="top-more-icon"
                style={{ width: "45px", height: "45px" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {colorMenuOpen && (
          <ColorSelectMenu
            handleColorClick={handleColorClick}
            handleBackground={handleBackground}
            anchorEl={colorAnchorEl}
            selectedColor={selectedColor}
            selectedBG={selectedBG}
            setSelectedBG={setSelectedBG}
            setTooltipAnchor={setTooltipAnchor}
            isOpen={colorMenuOpen}
            setIsOpen={setColorMenuOpen}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TopMenuHome;
