import Button from "@/components/Tools/Button";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import ColorSelectMenu from "../ColorSelectMenu";
import {
  batchUpdateAction,
  NoteUpdateAction,
  undoAction,
} from "@/utils/actions";

const TopMenuHome = ({
  notes,
  dispatchNotes,
  openSnackFunction,
  setFadingNotes,
  selectedNotesIDs,
  setSelectedNotesIDs,
  setTooltipAnchor,
}) => {
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [selectedBG, setSelectedBG] = useState(null);
  const [pinNotes, setPinNotes] = useState(false);
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
        !document.querySelector(".starting-div").classList.contains("dragging")
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
      let pinned = null;
      selectedNotesIDs.forEach((noteData) => {
        const note = notes.get(noteData.uuid);
        const color = note.color;
        const bg = note.background;
        if (pinned !== false) {
          if (note.isPinned) {
            pinned = true;
          } else {
            pinned = false;
          }
        }
        sharedColor.add(color);
        sharedBG.add(bg);
      });
      setPinNotes(pinned);
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
    const firstItem = selectedNotesIDs[0];
    const val = notes.get(firstItem.uuid).isArchived;
    const length = selectedNotesIDs.length;

    window.dispatchEvent(new Event("loadingStart"));

    batchUpdateAction({
      type: "BATCH_ARCHIVE",
      selectedNotes: selectedNotesIDs,
      val: val,
    }).then(() => window.dispatchEvent(new Event("loadingEnd")));

    const selectedUUIDs = selectedNotesIDs.map(({ uuid }) => uuid);

    setFadingNotes(new Set(selectedUUIDs));

    const undo = () => {
      window.dispatchEvent(new Event("loadingStart"));

      undoAction({
        type: "UNDO_BATCH_ARCHIVE",
        selectedNotes: selectedNotesIDs,
        val: val,
      }).then(() => window.dispatchEvent(new Event("loadingEnd")));

      dispatchNotes({
        type: "UNDO_BATCH_ARCHIVE",
        selectedNotes: selectedNotesIDs,
        isArchived: val,
        length: length,
      });
    };

    const snackMessage =
      length === 1 ? "Note archived" : `${length} notes archived`;

    openSnackFunction({
      snackMessage: snackMessage,
      snackOnUndo: undo,
    });

    handleClose();

    setTimeout(() => {
      dispatchNotes({
        type: "BATCH_ARCHIVE",
        selectedNotes: selectedNotesIDs,
        isArchived: val,
      });
      setFadingNotes(new Set());
    }, 200);
  };

  const handlePin = () => {
    handleClose();

    const firstItem = selectedNotesIDs[0];
    const ArchiveVal = notes.get(firstItem.uuid).isArchived;

    if (ArchiveVal) {
      const selectedUUIDs = selectedNotesIDs.map((data) => data.uuid);
      const length = selectedNotesIDs.length;
      setFadingNotes(new Set(selectedUUIDs));

      const undo = () => {
        window.dispatchEvent(new Event("loadingStart"));

        undoAction({
          type: "UNDO_BATCH_PIN_ARCHIVED",
          selectedNotes: selectedNotesIDs,
        }).then(() => window.dispatchEvent(new Event("loadingEnd")));

        dispatchNotes({
          type: "UNDO_BATCH_PIN_ARCHIVED",
          selectedNotes: selectedNotesIDs,
          length: length,
        });
      };

      const snackMessage =
        length === 1
          ? "Note unarchived and pinned"
          : `${length} notes unarchived and pinned`;

      openSnackFunction({
        snackMessage: snackMessage,
        snackOnUndo: undo,
      });
    }

    setTimeout(
      () => {
        dispatchNotes({
          type: "BATCH_PIN",
          selectedNotes: selectedNotesIDs,
          isPinned: pinNotes,
        });
        setFadingNotes(new Set());
      },
      ArchiveVal ? 200 : 0
    );
    window.dispatchEvent(new Event("loadingStart"));
    batchUpdateAction({
      type: "BATCH_PIN",
      selectedNotes: selectedNotesIDs,
      val: pinNotes,
    }).then(() => window.dispatchEvent(new Event("loadingEnd")));
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
                onClick={handlePin}
                className={pinNotes ? "top-pinned-icon" : "top-pin-icon"}
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
