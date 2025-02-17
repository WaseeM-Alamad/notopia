import { Popper } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ColorSelectMenu from "./ColorSelectMenu";
import { useAppContext } from "@/context/AppContext";
import DeleteModal from "./DeleteModal";
import { deleteLabelAction } from "@/utils/actions";

const LabelMenu = ({
  isOpen,
  setIsOpen,
  labelRef,
  anchorEl,
  colorMenuOpen,
  setColorMenuOpen,
  setTooltipAnchor,
  selectedColor,
  setSelectedColor,
  labelData,
  triggerReRender,
  dispatchNotes,
}) => {
  const { updateLabelColor, removeLabel } = useAppContext();
  const menuRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handler = (e) => {
      if (
        !menuRef?.current?.contains(e.target) &&
        !anchorEl?.contains(e.target)
      )
        if (isOpen) {
          setIsOpen(false);
        }
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  }, [isOpen]);

  const handleColorClick = (color) => {
    setSelectedColor(color);
    updateLabelColor(labelData.uuid, color);
    triggerReRender((prev) => !prev);
  };

  const handleDeleteLabel = () => {
    dispatchNotes({
      type: "REMOVE_LABEL_FROM_NOTES",
      labelUUID: labelData.uuid
    })
    removeLabel(labelData.uuid);
    window.dispatchEvent(new Event("loadingStart"));
    deleteLabelAction({labelUUID: labelData.uuid}).then(() => {
      window.dispatchEvent(new Event("loadingEnd"));
    });

    labelRef.current.style.opacity = "0";
    const handler = (e) => {
      if (e.propertyName === "opacity" && !isOpen) {
        triggerReRender((prev) => !prev);
        labelRef.current.removeEventListener("transitionend", handler);
      }
    };

    labelRef.current.addEventListener("transitionend", handler);
  };

  const containerClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!isMounted) return;

  return createPortal(
    <>
      <Popper
        open={isOpen}
        anchorEl={anchorEl}
        placement="bottom-start"
        modifiers={[
          {
            name: "preventOverflow",
            options: {
              boundariesElement: "window",
            },
          },
        ]}
      >
        {isOpen && (
          <motion.div
            onClick={containerClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.05,
            }}
            style={{
              width: "fit-content",
              borderRadius: "0.4rem",
              maxWidth: "14.0625rem",
              maxHeight: "26.96125rem",
            }}
            ref={menuRef}
            className="menu not-draggable"
          >
            <div className="menu-buttons not-draggable">
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn not-draggable"
                onClick={() => {
                  setDeleteModalOpen(true);
                  setIsOpen(false);
                }}
              >
                Delete label
              </div>
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn not-draggable"
                onClick={() => {
                  setColorMenuOpen(true);
                  setIsOpen(false);
                }}
              >
                Change color
              </div>
              <div
                style={{
                  padding: "0.6rem 2rem 0.6rem 1rem",
                  fontSize: "0.9rem",
                  color: "#3c4043",
                }}
                className="menu-btn not-draggable"
              >
                Rename label
              </div>
            </div>
          </motion.div>
        )}
      </Popper>
      <AnimatePresence>
        {colorMenuOpen && (
          <ColorSelectMenu
            handleColorClick={handleColorClick}
            anchorEl={anchorEl}
            selectedColor={selectedColor}
            setTooltipAnchor={setTooltipAnchor}
            isOpen={colorMenuOpen}
            setIsOpen={setColorMenuOpen}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModalOpen && (
          <DeleteModal
            setIsOpen={setDeleteModalOpen}
            handleDelete={handleDeleteLabel}
            message={
              "This label will be deleted and removed from all of your notes. Your notes won't be deleted."
            }
          />
        )}
      </AnimatePresence>
    </>,
    document.getElementById("moreMenu")
  );
};

export default memo(LabelMenu);
