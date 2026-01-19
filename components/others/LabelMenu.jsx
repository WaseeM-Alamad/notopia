import { Popper } from "@mui/material";
import { motion } from "framer-motion";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useLabelsContext } from "@/context/LabelsContext";

const LabelMenu = ({
  isOpen,
  setIsOpen,
  anchorEl,
  setColorMenuOpen,
  setSelectedColor,
  labelData,
  triggerReRender,
  labelTitleRef,
  setDeleteModalOpen,
  imageRef,
  setIsImageLoading,
}) => {
  const { openSnackRef } = useAppContext();
  const { handlePin, updateLabelImage, deleteLabelImage } = useLabelsContext();
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleClickOutside = (e) => {
      const menuEl = menuRef.current;
      const anchor = anchorEl?.contains ? anchorEl : null;
      const btnRef = anchorEl?.btnRef ?? null;

      if (
        isOpen &&
        !menuEl?.contains(e.target) &&
        !(anchor && anchor.contains(e.target)) &&
        btnRef !== e.target
      ) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, anchorEl]);

  const handleOnChange = async (event) => {
    const imageFile = event.target?.files[0];

    inputRef.current.value = "";
    setIsImageLoading(true);
    updateLabelImage(labelData.uuid, imageFile).then(() => {
      setIsImageLoading(false);
    });
    if (imageRef.current) {
      imageRef.current.src = labelData.image + `?v=${new Date().getTime()}`;
    }
    triggerReRender((prev) => !prev);
    setIsOpen(false);
  };

  const handleRenameLabel = () => {
    labelTitleRef.current.focus();
  };

  const handleRemoveImage = () => {
    const image = labelData.image;

    deleteLabelImage({ uuid: labelData.uuid, action: "remove" });
    triggerReRender((prev) => !prev);
    setIsOpen(false);
    const onClose = () => {
      deleteLabelImage({ uuid: labelData.uuid, action: "delete" });
      triggerReRender((prev) => !prev);
      setIsOpen(false);
    };

    const undo = () => {
      deleteLabelImage({
        uuid: labelData.uuid,
        image: image,
        action: "restore",
      });
      triggerReRender((prev) => !prev);
      setIsOpen(false);
    };

    openSnackRef.current({
      snackMessage: "Image deleted",
      snackOnUndo: undo,
      snackOnClose: onClose,
      unloadWarn: true,
    });
  };

  const handleLabelPin = () => {
    setIsOpen(false);
    handlePin(labelData.uuid);
    window.dispatchEvent(new Event("refreshPinnedLabels"));
    triggerReRender((prev) => !prev);
  };

  const containerClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!isMounted) return;

  return (
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
        <motion.div
          initial={{ opacity: 0, transform: "scale(0.97)" }}
          animate={{ opacity: 1, transform: "scale(1)" }}
          exit={{ opacity: 0, transform: "scale(0.97)" }}
          transition={{
            transform: {
              type: "spring",
              stiffness: 1100,
              damping: 50,
              mass: 1,
            },
            opacity: { duration: 0.15 },
          }}
          style={{
            transformOrigin: "top left",
            width: "fit-content",
            borderRadius: "0.4rem",
            maxWidth: "14.0625rem",
            maxHeight: "26.96125rem",
            pointerEvents: !isOpen && "none",
          }}
          ref={menuRef}
          className="menu not-draggable"
        >
          <div className="menu-buttons not-draggable">
            <div
              className="menu-btn label-menu-btn not-draggable"
              onClick={handleLabelPin}
            >
              {labelData.isPinned ? "Unpin from sidebar" : "Pin to sidebar"}
            </div>
            <div
              className="menu-btn label-menu-btn not-draggable"
              onClick={() => {
                setDeleteModalOpen(true);
                setIsOpen(false);
              }}
            >
              Delete label
            </div>
            <div
              className="menu-btn label-menu-btn not-draggable"
              onClick={() => {
                setColorMenuOpen(true);
                setIsOpen(false);
              }}
            >
              Change color
            </div>
            <div
              className="menu-btn label-menu-btn not-draggable"
              onClick={() => inputRef.current.click()}
            >
              {labelData.image ? "Change image" : "Add image"}
              <input
                ref={inputRef}
                style={{ display: "none" }}
                type="file"
                accept="image/*"
                onChange={handleOnChange}
              />
            </div>
            {labelData.image && (
              <div
                className="menu-btn label-menu-btn not-draggable"
                onClick={handleRemoveImage}
              >
                Remove image
              </div>
            )}
            <div
              className="menu-btn label-menu-btn not-draggable"
              onClick={handleRenameLabel}
            >
              Rename label
            </div>
          </div>
        </motion.div>
      </Popper>
    </>
  );
};

export default memo(LabelMenu);
