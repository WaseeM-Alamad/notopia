"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../assets/styles/NoteModal.css";
import PinClicked from "./PinClicked";
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

const NoteModal = ({
  divPosition,
  divSize,
  trigger,
  setTrigger,
  setOpacity,
  color,
  setColor,
  image,
  srcDate,
  isRemoteImage,
  setTitle,
  title,
  setContent,
  content,
  handleUpdate,
}) => {
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const [clickOutside, setClickOutside] = useState(false);
  const [mounted, setMounted] = useState(false);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);

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

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const handleTitleInput = (e) => {
    const text = e.target.textContent.trim();
    setTitle(text);

    // If it's empty, make sure the div is completely empty
    if (!text) {
      e.target.textContent = "";
    }
  };

  const handleContentInput = (e) => {
    const text = e.target.textContent.trim();

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

    return () => setMounted(false);
  }, [trigger]);

  if (!mounted) return null;

  // Use createPortal instead of ReactDom.createPortal
  return createPortal(
    <>
      <div
        onClick={(e) => {
          if (!innerRef.current?.contains(e.target)) {
            setContent(contentRef.current.textContent);
            setTitle(titleRef.current.textContent);
            setClickOutside(false);
            setTimeout(() => {
              setOpacity(true);
            }, 230);

            setTriggerAnimation(false);
            setTimeout(() => {
              setTrigger(false);
            }, 240);
          }
        }}
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
          zIndex: "10000",
          overflow: "hidden",
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
              "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.1s cubic-bezier(0.25, 0.8, 0.25, 1)",
            width: triggerAnimation ? "600px" : `${divSize.width}px`,
            height: triggerAnimation ? "" : `${divSize.height}px`,
            maxWidth: "600px",
            maxHeight: "829px",
            position: "fixed", // Fixed positioning relative to the viewport
            overflow: "hidden",
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
            {image && (
              <img
                src={isRemoteImage ? `${image}?v=${srcDate}` : image}
                draggable="false"
                style={{
                  width: "100%",
                  height: "fit-content",
                  borderTopLeftRadius: "0.5rem",
                  borderTopRightRadius: "0.5rem",
                  transition: "opacity 0.3s ease",
                }}
              />
            )}
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={handleTitleInput}
              onPaste={handlePaste}
              ref={titleRef}
              className="modal-title-input modal-editable-title"
              role="textbox"
              tabIndex="0"
              aria-multiline="true"
              aria-label="Title"
              spellCheck="false"
            />
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={handleContentInput}
              onPaste={handlePaste}
              ref={contentRef}
              className={`modal-content-input modal-editable-content`}
              role="textbox"
              tabIndex="0"
              aria-multiline="true"
              aria-label="Note"
              spellCheck="false"
            />
            <div className="date-div"></div>
          </div>

          <div className="actions-container">
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
              />
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                title="Add image"
                disableInteractive
              >
                <IconButton
                  sx={{
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  }}
                >
                  <input
                    style={{ display: "none" }}
                    // ref={uploadRef}
                    type="file"
                    id="single"
                    accept=".gif,.jpeg,.jpg,.png,image/gif,image/jpeg,image/jpg,image/png"
                    onChange={(event) => {
                      const file = event.target?.files[0];
                      setImageEvent(event);
                      setImageFile(file);
                      setImage(URL.createObjectURL(file));
                    }}
                  />
                  <ImageIcon />
                </IconButton>
              </Tooltip>
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                // title={isArchived ? "isArchived" : "Archive"}
                disableInteractive
              >
                <IconButton
                  sx={{
                    width: "34px",
                    height: "36px",
                    padding: "8px",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  }}
                >
                  {/* {isArchived ? ( */}
                  {true ? <ArchivedIcon check={color} /> : <ArchiveIcon />}
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
            <button type="button" className="close-button">
              Close
            </button>
          </div>
        </div>
      </div>
    </>,
    document.getElementById("portal")
  );
};

export default NoteModal;
