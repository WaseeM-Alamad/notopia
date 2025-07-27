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
import { useSearch } from "@/context/SearchContext";
import ImageDropZone from "../Tools/ImageDropZone";
import { validateImageFile } from "@/utils/validateImage";

const Label = ({
  labelData,
  isGrid,
  triggerReRender,
  fadingNotes,
  setVisibleItems,
  setFadingNotes,
  index,
  handleDeleteLabel,
  notes,
  order,
}) => {
  const {
    updateLabel,
    updateLabelColor,
    handlePin,
    updateLabelImage,
    deleteLabelImage,
    loadingImages,
    showTooltip,
    hideTooltip,
    closeToolTip,
    openSnackRef,
    calculateLayoutRef,
    labelsRef,
  } = useAppContext();
  const { labelSearchTerm } = useSearch();
  const [mounted, setMounted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [anchorEl, setAnchorEL] = useState(null);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [selected, setSelected] = useState(false);
  const [height, setHeight] = useState(0);
  const [labelExists, setLabelExists] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const labelDate = getNoteFormattedDate(labelData.createdAt);
  const [selectedColor, setSelectedColor] = useState(labelData.color);
  const labelRef = useRef(null);
  const labelTitleRef = useRef(null);
  const originalTitleRef = useRef(null);
  const moreRef = useRef(null);
  const dateRef = useRef(null);
  const imageRef = useRef(null);
  const inputRef = useRef(null);
  const isFirstRender = useRef(true);

  const checkExistence = (labelToCheck) => {
    for (const labelData of labelsRef.current.values()) {
      if (labelToCheck.toLowerCase() === labelData.label.toLowerCase()) {
        return true;
      }
    }
    return false;
  };

  const noteCount = order.filter((uuid) => {
    const note = notes.get(uuid);
    if (note.isTrash) return false;

    if (note.labels.includes(labelData.uuid)) return true;
  }).length;

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    labelTitleRef.current.innerText = labelData.label;
    originalTitleRef.current = labelData.label;
    setCharCount(() => {
      if (labelTitleRef.current.innerText.trim().length > 50) {
        return 50;
      }

      return labelTitleRef.current.innerText.trim().length;
    });
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
      openSnackRef.current({
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
      if (checkExistence(labelToCheck)) {
        if (!labelExists) {
          openSnackRef.current({
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
      window.dispatchEvent(new Event("refreshPinnedLabels"));
      if (
        labelSearchTerm.trim() &&
        !originalTitleRef.current
          .toLowerCase()
          .trim()
          .includes(labelSearchTerm.toLowerCase().trim())
      ) {
        setFadingNotes((prev) => {
          const updated = new Set(prev);
          updated.add(labelData.uuid);
          return updated;
        });
        setTimeout(() => {
          setFadingNotes((prev) => {
            const updated = new Set(prev);
            updated.delete(labelData.uuid);
            return updated;
          });
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            updated.delete(labelData.uuid);
            return updated;
          });
        }, 250);
      }
    } else {
      labelTitleRef.current.innerText = originalTitleRef.current.trim();
    }
    triggerReRender((prev) => !prev);
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
    calculateLayoutRef.current();
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

  const handleLabelClick = () => {
    const encodedLabel = encodeURIComponent(labelData.label);
    window.location.hash = `label/${encodedLabel.toLowerCase()}`;
  };

  const handleOnChange = async (event) => {
    event.stopPropagation();
    const imageFile = event.target?.files[0];

    inputRef.current.value = "";

    const { valid } = await validateImageFile(imageFile);

    if (!valid) {
      openSnackRef.current({
        snackMessage:
          "Can’t upload this file. We accept GIF, JPEG, JPG, PNG files less than 10MB and 25 megapixels.",
        showUndo: false,
      });
      return;
    }

    updateLabelImage(labelData.uuid, imageFile).then(() => {});
    if (imageRef.current) {
      imageRef.current.src = labelData.image + `?v=${new Date().getTime()}`;
    }
    triggerReRender((prev) => !prev);
    setIsOpen(false);
  };

  const handleRenameLabel = () => {
    setIsFocused(true);
    requestAnimationFrame(() => {
      labelTitleRef.current.focus();
    });
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
        setColorAnchorEl(moreRef.current);
        setColorMenuOpen(true);
        setIsOpen(false);
      },
      icon: "color-menu-icon",
    },
    {
      title: labelData.image ? "Change image" : "Add image",
      function: () => {
        inputRef.current.click();
        setIsOpen(false);
      },
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

  function highlightMatch(text) {
    if (!labelSearchTerm) return text;

    const regex = new RegExp(`(${labelSearchTerm.toLowerCase().trim()})`, "ig");

    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 800,
          damping: 50,
          mass: 1,
        }}
        className={`label-container ${isGrid ? "grid-label" : "list-label"}`}
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
        <div
          className={`label label-${labelData.color} ${
            selected
              ? "element-selected"
              : labelData.color === "Default"
                ? "default-border"
                : "transparent-border"
          } ${fadingNotes.has(labelData.uuid) ? "fade-out" : ""} `}
        >
          <div
            style={{ display: labelData.image && "none" }}
            className="corner"
          />
          <div className="label-more-icon">
            <Button
              onClick={handleMoreClick}
              onMouseEnter={(e) => showTooltip(e, "Options")}
              onMouseLeave={hideTooltip}
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
                draggable="false"
                ref={imageRef}
                style={{
                  width: "100%",
                  display: "block",
                  opacity: !loadingImages.has(labelData.uuid) ? "1" : "0.5",
                  transition: "opacity 0.2s ease",
                }}
                src={labelData.image}
              />
              <AnimatePresence>
                {loadingImages.has(labelData.uuid) && (
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
              style={{ display: !isFocused && "none" }}
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

                if (e.key === "Escape") {
                  e.currentTarget.blur();
                }

                if (e.key === "Enter") {
                  e.preventDefault();
                  const oldLabel = originalTitleRef.current
                    .toLowerCase()
                    .trim();
                  const newLabel = labelTitleRef.current.innerText
                    .toLowerCase()
                    .trim();
                  if (checkExistence(newLabel) && newLabel !== oldLabel) {
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
                moreRef.current.classList.add("zero-opacity");
                dateRef.current.classList.add("zero-opacity");
              }}
              onBlur={handleOnBlur}
              onClick={(e) => {
                if (!isFocused) return;
                e.stopPropagation();
              }}
              ref={labelTitleRef}
              dir="auto"
              className="label-title-input"
              role="textbox"
              tabIndex="0"
              aria-multiline="true"
              spellCheck="false"
            />
            <div
              style={{ display: isFocused && "none" }}
              className="label-title-input"
              dir="auto"
            >
              {highlightMatch(labelData.label)}
            </div>
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
                {noteCount > 0 && (
                  <>
                    ,
                    <span style={{ paddingLeft: "0.4rem" }}>
                      {noteCount + " notes"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence>{isDragOver && <ImageDropZone />}</AnimatePresence>
      </motion.div>
      <input
        className="labelInput"
        ref={inputRef}
        style={{ display: "none" }}
        type="file"
        onChange={handleOnChange}
      />
      <AnimatePresence>
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
            anchorEl={colorAnchorEl}
            selectedColor={selectedColor}
            isOpen={colorMenuOpen}
            setIsOpen={setColorMenuOpen}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Label);
