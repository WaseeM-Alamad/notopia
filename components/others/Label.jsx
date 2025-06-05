import React, { memo, useEffect, useRef, useState } from "react";
import Button from "../Tools/Button";
import MoreVert from "../icons/MoreVert";
import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import { AnimatePresence, motion } from "framer-motion";
import LabelMenu from "./LabelMenu";
import { useAppContext } from "@/context/AppContext";
import DeleteModal from "./DeleteModal";
import ColorSelectMenu from "./ColorSelectMenu";
import MoreMenu from "./MoreMenu";

const Label = ({
  labelData,
  setTooltipAnchor,
  triggerReRender,
  dispatchNotes,
  index,
  calculateLayout,
  openSnackFunction,
  handleDeleteLabel,
}) => {
  const {
    updateLabel,
    updateLabelColor,
    handlePin,
    updateLabelImage,
    deleteLabelImage,
    labelLookUPRef,
  } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [anchorEl, setAnchorEL] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [selected, setSelected] = useState(false);
  const [height, setHeight] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [labelExists, setLabelExists] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const labelDate = getNoteFormattedDate(labelData.createdAt);
  const [selectedColor, setSelectedColor] = useState(labelData.color);
  const isRemoteImage =
    labelData.image?.startsWith("http") || labelData.image?.startsWith("https");
  const labelRef = useRef(null);
  const labelTitleRef = useRef(null);
  const originalTitleRef = useRef(null);
  const moreRef = useRef(null);
  const dateRef = useRef(null);
  const imageRef = useRef(null);
  const inputRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    labelTitleRef.current.innerText = labelData.label;
    originalTitleRef.current = labelData.label;
    setCharCount(() => {
      if (labelTitleRef.current.innerText.trim().length > 50) {
        return 50;
      }

      return labelTitleRef.current.innerText.trim().length;
    });

    setTimeout(() => {
      setMounted(true);
    }, 10);
  }, []);

  const handleMoreClick = (e) => {
    e.stopPropagation();
    closeToolTip();
    setAnchorEL(e.currentTarget);
    setIsOpen((prev) => !prev);
    setColorMenuOpen(false);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain").replace(/\n/g, "");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const setCursorAtEnd = (ref) => {
    const element = ref?.current;
    if (element) {
      element.focus();

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false); // Move to the end
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const handleTitleInput = (e) => {
    if (labelExists) {
      setLabelExists(false);
    }
    const text = e.target.innerText;
    const length = text.length;
    setCharCount(() => {
      if (text.trim().length > 50) {
        return 50;
      }

      return text.trim().length;
    });

    if (length > 50) {
      // If text exceeds limit, truncate it
      const truncated = text.slice(0, 50);
      labelTitleRef.current.innerText = truncated;

      // Move cursor to end
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(labelTitleRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const handleOnBlur = () => {
    setIsFocused(false);
    setLabelExists(false);
    labelTitleRef.current.blur();
    moreRef.current.classList.remove("zero-opacity");
    dateRef.current.classList.remove("zero-opacity");
    labelTitleRef.current.style.removeProperty("pointer-events");
    if (labelTitleRef.current.innerText.trim() === "") {
      openSnackFunction({
        snackMessage: "Label cannot be empty",
        showUndo: false,
      });
      labelTitleRef.current.innerText = originalTitleRef.current;
      return;
    }
    if (
      labelTitleRef.current.innerText.trim() !== originalTitleRef.current.trim()
    ) {
      const labelToCheck = labelTitleRef.current.innerText.toLowerCase().trim();
      if (labelLookUPRef.current.has(labelToCheck)) {
        if (!labelExists) {
          openSnackFunction({
            snackMessage: "Label already exists!",
            showUndo: false,
          });
        }
        labelTitleRef.current.innerText = originalTitleRef.current.trim();
        return;
      }
      updateLabel(
        labelData.uuid,
        labelTitleRef.current.innerText.trim(),
        originalTitleRef.current
      );
      originalTitleRef.current = labelTitleRef.current.innerText.trim();
    } else {
      labelTitleRef.current.innerText = originalTitleRef.current.trim();
    }
  };

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    if (labelRef.current) {
      observer.observe(labelRef.current);
    }

    return () => {
      observer.disconnect(); // Cleanup observer on unmount
    };
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    calculateLayout();
  }, [height]);

  const handleColorClick = (color) => {
    if (labelData.color === color) return;
    setSelectedColor(color);
    updateLabelColor(labelData.uuid, color);
    triggerReRender((prev) => !prev);
  };

  const handleDelete = () => {
    handleDeleteLabel({
      labelData: labelData,
      labelRef: labelRef,
      isOpen: isOpen,
      triggerReRender: triggerReRender,
    });
  };

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
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

  const handleLabelClick = () => {
    const encodedLabel = encodeURIComponent(labelData.label);
    window.location.hash = `label/${encodedLabel.toLowerCase()}`;
  };

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

    openSnackFunction({
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

  const menuItems = [
    {
      title: labelData.isPinned ? "Unpin from sidebar" : "Pin to sidebar",
      function: handleLabelPin,
      icon: labelData.isPinned ? "unpin-menu-icon" : "pin-menu-icon",
    },
    {
      title: "Delete label",
      function: () => {
        setDeleteModalOpen(true);
        setIsOpen(false);
      },
      icon: "trash-menu-icon",
    },
    {
      title: "Change color",
      function: () => {
        setColorMenuOpen(true);
        setIsOpen(false);
      },
      icon: "color-menu-icon",
    },
    {
      title: labelData.image ? "Change image" : "Add image",
      function: () => inputRef.current.click(),
      icon: "image-menu-icon",
    },
    {
      title: labelData.image ? "Remove image" : "",
      function: handleRemoveImage,
      icon: "remove-image-menu-icon",
    },
    {
      title: "Rename label",
      function: handleRenameLabel,
      icon: "edit-menu-icon",
    },
  ];

  return (
    <>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          closeToolTip();

          const virtualAnchor = {
            getBoundingClientRect: () =>
              new DOMRect(
                e.pageX - window.scrollX,
                e.pageY - window.scrollY,
                0,
                0
              ),
            contextElement: document.body,
          };

          setAnchorEL(virtualAnchor);
          setIsOpen((prev) => !prev);
        }}
        onClick={handleLabelClick}
        ref={labelRef}
        style={{
          transition: `transform ${
            mounted ? "0.22s" : "0s"
          } cubic-bezier(0.2, 0, 0, 1), opacity 0.23s ease`,
        }}
      >
        <motion.div
          className={`label label-${labelData.color} ${
            selected
              ? "element-selected"
              : labelData.color === "Default"
              ? "default-border"
              : "transparent-border"
          }`}
        >
          <div
            style={{ display: labelData.image && "none" }}
            className="corner"
          />
          <div className="label-more-icon">
            <Button
              onClick={handleMoreClick}
              onMouseEnter={(e) => handleMouseEnter(e, "Options")}
              onMouseLeave={handleMouseLeave}
              ref={moreRef}
              className="btn-hover"
              style={{
                zIndex: "20",
                marginLeft: "auto",
                opacity: (isOpen || colorMenuOpen) && "1",
              }}
            >
              <MoreVert size="16" style={{ rotate: "90deg" }} />
            </Button>
          </div>
          {labelData.image && (
            <div style={{ position: "relative" }}>
              <img
                ref={imageRef}
                style={{
                  width: "100%",
                  display: "block",
                  opacity: !isImageLoading ? "1" : "0.5",
                  transition: "opacity 0.2s ease",
                }}
                src={
                  isRemoteImage
                    ? labelData.image + `?v=${new Date().getTime()}`
                    : labelData.image
                }
              />
              <AnimatePresence>
                {isImageLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="linear-loader"
                  />
                )}
              </AnimatePresence>
            </div>
          )}
          <div style={{ padding: "0.8rem .7rem" }}>
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{
                    y: 3,
                    opacity: 0,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  exit={{
                    y: 5,
                    opacity: 0,
                  }}
                  transition={{
                    y: {
                      type: "spring",
                      stiffness: 1000,
                      damping: 70,
                      mass: 1,
                    },
                    opacity: { duration: 0.2 },
                  }}
                  className="edit-icon"
                />
              )}
            </AnimatePresence>
            <div
              style={{
                display: "flex",
                position: "relative",
              }}
            ></div>
            <div
              contentEditable={isFocused}
              data-index={index}
              suppressContentEditableWarning
              onInput={handleTitleInput}
              onKeyDown={(e) => {
                if (
                  (e.ctrlKey && e.key === "z") ||
                  (e.ctrlKey && e.shiftKey && e.key === "Z")
                ) {
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const oldLabel = originalTitleRef.current
                    .toLowerCase()
                    .trim();
                  const newLabel = labelTitleRef.current.innerText
                    .toLowerCase()
                    .trim();
                  if (
                    labelLookUPRef.current.has(newLabel) &&
                    newLabel !== oldLabel
                  ) {
                    setLabelExists(true);
                  } else {
                    labelTitleRef.current.blur();
                  }
                }
              }}
              onPaste={handlePaste}
              onFocus={() => {
                labelTitleRef.current.style.pointerEvents = "auto";
                setCursorAtEnd(labelTitleRef);
                setIsOpen(false);
                setCharCount(() => {
                  if (labelTitleRef.current.innerText.trim().length > 50) {
                    return 50;
                  }

                  return labelTitleRef.current.innerText.trim().length;
                });
                setIsFocused(true);
                moreRef.current.classList.add("zero-opacity");
                dateRef.current.classList.add("zero-opacity");
              }}
              onBlur={handleOnBlur}
              ref={labelTitleRef}
              dir="auto"
              className="label-title-input"
              role="textbox"
              tabIndex="0"
              aria-multiline="true"
              spellCheck="false"
            />
            <div
              style={{
                color: "#5E5E5E",
                fontSize: "0.8rem",
                position: "relative",
              }}
            >
              <AnimatePresence>
                {isFocused && (
                  <motion.div
                    initial={{
                      y: 0,
                      opacity: 0,
                    }}
                    animate={{
                      y: 0,
                      opacity: 1,
                    }}
                    exit={{
                      y: 0,
                      opacity: 0,
                    }}
                    transition={{
                      y: {
                        type: "spring",
                        stiffness: 1000,
                        damping: 70,
                        mass: 1,
                      },
                      opacity: { duration: 0.2 },
                    }}
                    className="label-bottom-message"
                    style={{
                      position: "absolute",
                      fontSize: "0.7rem",
                    }}
                  >
                    {labelExists ? (
                      <span> Label already exists </span>
                    ) : (
                      <span>{50 - charCount} Characters left</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <div
                ref={dateRef}
                className="label-date"
                style={{ opacity: (isOpen || colorMenuOpen) && "1" }}
              >
                {labelDate}
                {labelData?.noteCount > 0 && (
                  <>
                    ,
                    <span style={{ paddingLeft: "0.4rem" }}>
                      {labelData?.noteCount + " notes"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
        <input
          ref={inputRef}
          style={{ display: "none", position: "fixed" }}
          type="file"
          onChange={handleOnChange}
        />
      </div>
      <AnimatePresence>
        {/* {isOpen && (
          <LabelMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            setColorMenuOpen={setColorMenuOpen}
            setDeleteModalOpen={setDeleteModalOpen}
            anchorEl={anchorEl}
            setSelectedColor={setSelectedColor}
            labelData={labelData}
            triggerReRender={triggerReRender}
            labelTitleRef={labelTitleRef}
            imageRef={imageRef}
            setIsImageLoading={setIsImageLoading}
            openSnackFunction={openSnackFunction}
          />
        )} */}
        {isOpen && (
          <MoreMenu
            setIsOpen={setIsOpen}
            anchorEl={anchorEl}
            isOpen={isOpen}
            menuItems={menuItems}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteModalOpen && (
          <DeleteModal
            setIsOpen={setDeleteModalOpen}
            handleDelete={handleDelete}
            title="Delete label"
            message={
              "This label will be deleted and removed from all of your notes. Your notes won't be deleted."
            }
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {colorMenuOpen && (
          <ColorSelectMenu
            isLabel={true}
            handleColorClick={handleColorClick}
            anchorEl={anchorEl}
            selectedColor={selectedColor}
            setTooltipAnchor={setTooltipAnchor}
            isOpen={colorMenuOpen}
            setIsOpen={setColorMenuOpen}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Label);
