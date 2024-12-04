"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../assets/styles/NoteModal.css";
import PinClicked from "./PinClicked";
import Pin from "./Pin";
import ArchiveIcon from "./ArchiveIcon";
import ArchivedIcon from "./ArchivedIcon";
import ReminderIcon from "./ReminderIcon";
import ImageIcon from "./ImageIcon";
import PersonAddIcon from "./PersonAdd";
import MoreIcon from "./MoreIcon";
import UndoIcon from "./UndoIcon";
import RedoIcon from "./RedoIcon";
import ColorSelectMenu from "./ColorSelectMenuModal";
import { IconButton, Tooltip } from "@mui/material";
import { Box } from "@mui/system";
import { LinearProgress } from "@mui/material";

const NoteModal = ({
  divPosition,
  divSize,
  trigger,
  setTrigger,
  setOpacity,
  color,
  setColor,
  image,
  setTitle,
  title,
  setContent,
  content,
  handleUpdate,
  noteImagePending,
  updateTextDebounced,
  isArchived,
  setIsArchived,
  isPinnedNote,
  setIsPinnedNote,
  imageUpload,
  imagePending,
  loadingNoteID,
  Noteuuid,
}) => {
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const [clickOutside, setClickOutside] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isRemoteImage = image?.startsWith("http") || image?.startsWith("https");
  const [srcDate, setSrcDate] = useState(Date.now());
  const [modalTitle, setModalTitle] = useState(title);
  const [modalContent, setModalContent] = useState(content);
  const [pinHover, setPinHover] = useState(false);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const closeRef = useRef(null);
  const uploadRef = useRef(null);

  const TooltipPosition = {
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, -11], // Adjust position (x, y)
        },
      },
    ],
  };

  const slotProps = {
    tooltip: {
      sx: {
        height: "fit-content",
        margin: "0",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        fontFamily: "Roboto",
        fontWeight: "400",
        fontSize: "0.76rem",
        padding: "5px 8px 5px 8px",
      },
    },
  };

  console.log("NoteModal rendered");

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const handleTitleInput = (e) => {
    const text = e.target.textContent.trim();
    setModalTitle(text);
    updateTextDebounced({ title: text, content: modalContent });

    // If it's empty, make sure the div is completely empty
    if (!text) {
      e.target.textContent = "";
    }
  };

  const handleContentInput = (e) => {
    const text = e.target.textContent.trim();
    setModalContent(text);
    updateTextDebounced({ title: modalTitle, content: text });

    if (!text) {
      e.target.textContent = "";
    }
  };

  useEffect(() => {
    setMounted(true);

    if (contentRef.current) contentRef.current.textContent = content;

    if (titleRef.current) titleRef.current.textContent = title;

    if (trigger) {
      setClickOutside(true);
      setTimeout(() => {
        setTriggerAnimation(true);
      }, 50);
    }

    document.body.style.overflow = trigger ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto"); // Cleanup

    return () => setMounted(false);
  }, [trigger]);

  if (!mounted) return null;

  const closeModal = (e) => {
    if (
      !innerRef.current?.contains(e.target) ||
      closeRef.current === e.target
    ) {
      if (content !== modalContent) {
        setContent(modalContent);
      }

      if (title !== modalTitle) {
        setTitle(modalTitle);
      }

      setModalContent(contentRef.current.textContent);
      setModalTitle(titleRef.current.textContent);
      setClickOutside(false);
      setTimeout(() => {
        setOpacity(true);
      }, 230);

      setTriggerAnimation(false);
      setTimeout(() => {
        setTrigger(false);
      }, 240);
    }
  };

  // Use createPortal instead of ReactDom.createPortal
  return createPortal(
    <>
      <div
        onClick={closeModal}
        ref={outerRef}
        style={{
          display: trigger ? "" : "none",
          position: "fixed",
          backgroundColor: triggerAnimation
            ? "rgba(0,0,0,0.5)"
            : "rgba(0,0,0,0)",
          width: "100%",
          height: "100%",
          top: "0",
          left: "0",
          zIndex: "101",
          overflow: "hidden",
          padding: "16px",
          transition: "background-color 0.3s ease",
        }}
      >
        <div
          ref={innerRef}
          style={{
            userSelect: "none",
            outline:
              color === "solid 1px #FFFFFF"
                ? "solid 1px #e0e0e0"
                : `solid 1px ${color}`,
            borderRadius: "0.5rem",
            backgroundColor: `${color}`,
            opacity: "1",
            transition:
              "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.1s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.25s linear",
            width: triggerAnimation ? "600px" : `${divSize.width}px`,
            height: triggerAnimation ? "" : `${divSize.height}px`,
            maxWidth: "600px",
            maxHeight: "829px",
            position: "fixed", // Fixed positioning relative to the viewport
            left: triggerAnimation ? "50%" : `${divPosition.x}px`, // Set the x position based on the tracked div
            top: triggerAnimation ? "30%" : `${divPosition.y}px`, // Set the y position based on the tracked div
            transform: triggerAnimation && "translate(-50%, -30%)",
          }}
        >
          <div
            className="modal-inputs-container"
            style={{
              maxHeight: "785px",
              overflowX: "hidden",
              overflowY: triggerAnimation ? "auto" : "hidden",
            }}
          >
            <div
              style={{
                position: image ? "absolute" : "",
              }}
              className="modal-corner"
            />
            <Tooltip
              slotProps={slotProps}
              PopperProps={TooltipPosition}
              sx={{ zIndex: "100" }}
              title={isPinnedNote ? "Unpin note" : "Pin note"}
              disableInteractive
            >
              <IconButton
                disableTouchRipple
                sx={{
                  zIndex: "1",
                  opacity: clickOutside ? "1" : "0",
                  "&:hover": { backgroundColor: "rgba(95, 99, 104, 0.157)" },
                  transition: "opacity 0.3s ease",
                }}
                id="modal-note-pin"
                onMouseOver={() => setPinHover(true)}
                onMouseLeave={() => setPinHover(false)}
                onClick={() => {
                  setIsPinnedNote((prev) => !prev);
                  handleUpdate("isPinned", !isPinnedNote);
                }}
              >
                <PinClicked
                  image={image}
                  pinImgDis={isPinnedNote ? "block" : "none"}
                  style={{
                    display: isPinnedNote ? "block" : "none",
                    opacity:
                      color !== "#FFFFFF" ? (!pinHover ? "0.54" : "1") : "1",
                    transition: "opacity 0s ease-in",
                  }}
                  color={
                    !pinHover
                      ? color !== "#FFFFFF"
                        ? "#212121"
                        : "#757575"
                      : "#212121"
                  }
                  opacity={pinHover ? "0.87" : "0.54"}
                />

                <Pin
                  image={image}
                  pinImgDis={!isPinnedNote ? "block" : "none"}
                  style={{
                    display: isPinnedNote ? "none" : "block",
                    opacity:
                      color !== "#FFFFFF" ? (!pinHover ? "0.64" : "1") : "1",
                    transition: "opacity 0.2s ease-in",
                  }}
                  color={
                    !pinHover
                      ? color !== "#FFFFFF"
                        ? "#212121"
                        : "#757575"
                      : "#212121"
                  }
                  opacity={pinHover ? "0.87" : "0.54"}
                />
              </IconButton>
            </Tooltip>
            {image && (
              <div
                style={{
                  position: "relative",
                  zIndex: "0",
                  overflow: "hidden",
                  borderTopLeftRadius: "0.5rem",
                  borderTopRightRadius: "0.5rem",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    opacity: noteImagePending ? "0.6" : "1",
                    transition: "opacity 0.2s ease-in",
                  }}
                >
                  <img
                    src={isRemoteImage ? `${image}?v=${srcDate}` : image}
                    draggable="false"
                    style={{
                      width: "100%",
                      height: "fit-content",
                      borderTopLeftRadius: "0.5rem",
                      borderTopRightRadius: "0.5rem",
                      opacity:
                        imagePending && loadingNoteID === Noteuuid
                          ? "0.6"
                          : "1",
                      transition: "opacity 0.2s ease-in",
                    }}
                  />
                </div>
                {imagePending && loadingNoteID === Noteuuid && (
                  <Box
                    sx={{
                      width: "100%",
                      position: "absolute",
                      bottom: "0",
                    }}
                  >
                    <LinearProgress />
                  </Box>
                )}
                {noteImagePending && (
                  <Box
                    sx={{
                      width: "100%",
                      position: "absolute",
                      bottom: "0",
                    }}
                  >
                    <LinearProgress />
                  </Box>
                )}
              </div>
            )}
            {!image && !modalTitle && !modalContent && !clickOutside && (
              <div
                className="modal-empty-note"
                aria-label="Empty note"
                spellCheck="false"
              />
            )}
            <div
              style={{
                display: clickOutside
                  ? ""
                  : modalContent && !modalTitle
                  ? "none"
                  : !modalTitle && !modalContent
                  ? "none"
                  : "",
                transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
              }}
              contentEditable
              suppressContentEditableWarning
              onInput={handleTitleInput}
              onPaste={handlePaste}
              ref={titleRef}
              className={`${
                triggerAnimation
                  ? "modal-title-input"
                  : "modal-closed-title-input"
              } modal-editable-title`}
              role="textbox"
              tabIndex="0"
              aria-multiline="true"
              aria-label="Title"
              spellCheck="false"
            />
            <div
              style={{
                display: clickOutside
                  ? ""
                  : !modalContent && modalTitle
                  ? "none"
                  : !modalTitle && !modalContent
                  ? "none"
                  : "",
                transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
              }}
              contentEditable
              suppressContentEditableWarning
              onInput={handleContentInput}
              onPaste={handlePaste}
              ref={contentRef}
              className={`${
                triggerAnimation
                  ? "modal-content-input"
                  : "modal-closed-content-input"
              } modal-editable-content`}
              role="textbox"
              tabIndex="0"
              aria-multiline="true"
              aria-label="Note"
              spellCheck="false"
            />
            <div className="date-div"></div>
          </div>

          <div
            style={{
              visibility: triggerAnimation ? "visible" : "hidden",
              opacity: clickOutside ? "1" : "0",
              transition: "opacity 0.6s ease",
            }}
            className="actions-container"
          >
            <div className="action-buttons">
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                title="Remind me"
                disableInteractive
              >
                <IconButton
                  sx={{
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  }}
                >
                  <ReminderIcon />
                </IconButton>
              </Tooltip>
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                title="Collaborator"
                disableInteractive
              >
                <IconButton
                  sx={{
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  }}
                >
                  <PersonAddIcon />
                </IconButton>
              </Tooltip>
              <ColorSelectMenu
                selectedColor={color}
                setSelectedColor={setColor}
                handleUpdate={handleUpdate}
              />
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                title="Add image"
                disableInteractive
              >
                <input
                  style={{ display: "none" }}
                  ref={uploadRef}
                  type="file"
                  id="single"
                  accept=".gif,.jpeg,.jpg,.png,image/gif,image/jpeg,image/jpg,image/png"
                  onChange={imageUpload}
                />
                <IconButton
                  sx={{
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  }}
                  onClick={() => uploadRef.current.click()}
                >
                  <ImageIcon />
                </IconButton>
              </Tooltip>
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                title={isArchived ? "isArchived" : "Archive"}
                disableInteractive
              >
                <IconButton
                  sx={{
                    width: "34px",
                    height: "36px",
                    padding: "8px",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  }}
                  onClick={() => {
                    setIsArchived(!isArchived);
                    handleUpdate("isArchived", !isArchived);
                  }}
                >
                  {isArchived ? (
                    <ArchivedIcon check={color} />
                  ) : (
                    <ArchiveIcon />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                title="More"
                disableInteractive
              >
                <IconButton
                  sx={{
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  }}
                >
                  <MoreIcon />
                </IconButton>
              </Tooltip>
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                title="Undo"
                disableInteractive
              >
                <IconButton
                  sx={{
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  }}
                >
                  <UndoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                title="Redo"
                disableInteractive
              >
                <IconButton
                  sx={{
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  }}
                >
                  <RedoIcon />
                </IconButton>
              </Tooltip>
            </div>
            <button
              ref={closeRef}
              onClick={closeModal}
              type="button"
              className="close-button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>,
    document.getElementById("portal")
  );
};

export default React.memo(NoteModal);
