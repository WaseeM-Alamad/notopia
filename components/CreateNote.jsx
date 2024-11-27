"use client";
import React, { useState, useRef, useEffect } from "react";
import "@/assets/styles/CreateNote.css";
import { v4 as uuid } from "uuid";
import ColorSelectMenu from "./ColorSelectMenuForm";
import Pin from "./Pin";
import { IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PinClicked from "./PinClicked";
import ArchiveIcon from "./ArchiveIcon";
import ArchivedIcon from "./ArchivedIcon";
import ReminderIcon from "./ReminderIcon";
import ImageIcon from "./ImageIcon";
import PersonAddIcon from "./PersonAdd";
import MoreIcon from "./MoreIcon";
import UndoIcon from "./UndoIcon";
import RedoIcon from "./RedoIcon";
import uploadFile from "@/actions/actions";
import ArchSnack from "./ArchSnack";
import ImageSnack from "./ImageSnack";
import { motion, AnimatePresence } from "framer-motion";
import NoteIcon from "./NoteIcon";

const CreateNote = ({ setNotes, userID, height }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [isPinned, setIsPinned] = useState(false);
  const [pinHover, setPinHover] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [archSnackOpen, setArchSnackOpen] = useState(false);
  const [imageSnackOpen, setImageSnackOpen] = useState(false);
  const [note, setNote] = useState({
    title: "",
    content: "",
    color: "",
  });
  const [imagePending, setImagePending] = useState(false);
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState("");
  const [imageEvent, setImageEvent] = useState();
  const boxRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const snackRef = useRef(null);
  const imageSnackRef = useRef(null);
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

  const submitNote = async (newNote) => {
    if (note.title.trim() || note.content.trim() || image) {
      try {
        const formData = new FormData();
        formData.append("uuid", newNote.uuid);
        formData.append("titleInput", newNote.title.trim());
        formData.append("contentInput", newNote.content.trim());
        formData.append("color", selectedColor);
        formData.append("isPinned", isPinned);
        formData.append("isArchived", isArchived);
        const response = await fetch("/api/notes", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.error("Error submitting note:", error);
      }
    }
    return false;
  };

  useEffect(() => {
    const handler = (e) => {
      if (
        !boxRef.current?.contains(e.target) &&
        !snackRef.current?.contains(e.target) &&
        !imageSnackRef.current?.contains(e.target)
      ) {
        const closeButton = boxRef.current?.querySelector(".close-button");
        closeButton?.click();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  const handleClose = async () => {
    setIsExpanded(false);
    setIsPinned(false);
    setIsArchived(false);
    setArchSnackOpen(false);
    setSelectedColor("#FFFFFF");
    const Noteuuid = uuid();
    if (note.title.trim() || note.content.trim() || image) {
      const newNote = {
        ...note,
        uuid: Noteuuid,
        title: note.title.trim(),
        content: note.content.trim(),
        color: selectedColor,
        isPinned: isPinned,
        isArchived: isArchived,
        image: image,
      };

      setNotes((prevNotes) => [...prevNotes, newNote]);
      titleRef.current.textContent = "";
      contentRef.current.textContent = "";
      await submitNote(newNote);
      if (image) {
        uploadFile(imageEvent, userID, setImagePending, Noteuuid);
      }
    }

    setNote({ title: "", content: "", color: "" });

    setImage("");
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const handleContentInput = (e) => {
    const text = e.target.textContent.trim();
    setNote({ ...note, content: text });
    setIsExpanded(true);
    // If it's empty, make sure the div is completely empty
    if (!text) {
      e.target.textContent = "";
    }
  };

  const handleTitleInput = (e) => {
    const text = e.target.textContent.trim();
    setNote({ ...note, title: text });

    // If it's empty, make sure the div is completely empty
    if (!text) {
      e.target.textContent = "";
    }
  };

  return (
    <>
      <div className="box-container">
        <div
          style={{ boxShadow: isExpanded ? "0 2.4px 5px rgba(0,0,0,.30)" : "" }}
          className="note-card shadow"
        >
          <div
            style={{
              background: selectedColor,
              boxShadow:
                "0 1px 2px 0 rgba(60,64,67,0.3),0 2px 6px 2px rgba(60,64,67,0.15)",
            }}
            ref={boxRef}
            className="note-card"
          >
            <div className="inputs-container">
              <div
                style={{
                  display: isExpanded ? "" : "none",
                  position: image ? "absolute" : "",
                }}
                className="corner"
              />
              <Tooltip
                slotProps={slotProps}
                PopperProps={{
                  modifiers: [
                    {
                      name: "offset",
                      options: {
                        offset: [0, -2], // Adjust position (x, y)
                      },
                    },
                  ],
                }}
                disableHoverListener={isExpanded ? false : true}
                title={isPinned ? "Unpin note" : "Pin note"}
                disableInteractive
              >
                <div
                  style={{ display: isExpanded ? "" : "none" }}
                  className="pin-button"
                >
                  <IconButton
                    sx={{
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                      display: isExpanded ? "" : "none",
                    }}
                    onMouseOver={() => {
                      setPinHover(true);
                    }}
                    onMouseLeave={() => {
                      setPinHover(false);
                    }}
                    onClick={() => {
                      setIsPinned((prev) => !prev);
                    }}
                  >
                    {isExpanded &&
                      (isPinned ? (
                        <PinClicked
                          style={{
                            opacity:
                              selectedColor !== "#FFFFFF"
                                ? !pinHover
                                  ? "0.74"
                                  : "1"
                                : "1",
                            transition: "opacity 0.2s ease-in",
                          }}
                          color={
                            !pinHover
                              ? selectedColor !== "#FFFFFF"
                                ? "#212121"
                                : "#757575"
                              : "#212121"
                          }
                        />
                      ) : (
                        <Pin
                          style={{
                            opacity:
                              selectedColor !== "#FFFFFF"
                                ? !pinHover
                                  ? "0.64"
                                  : "1"
                                : "1",
                            transition: "opacity 0.2s ease-in",
                          }}
                          color={
                            !pinHover
                              ? selectedColor !== "#FFFFFF"
                                ? "#212121"
                                : "#757575"
                              : "#212121"
                          }
                        />
                      ))}
                  </IconButton>
                </div>
              </Tooltip>

              {image && (
                <div className="imageWrapper">
                  <img
                    style={{
                      width: "100%",
                      height: "100%",
                      borderTopLeftRadius: "0.5rem",
                    }}
                    alt="image"
                    src={image}
                  />
                  <button
                    className="delete"
                    onClick={() => {
                      if (uploadRef.current) uploadRef.current.value = "";
                      setImage("");
                      setImageSnackOpen(true);
                    }}
                  >
                    <DeleteIcon
                      sx={{
                        color: "white",
                        width: "18px",
                        height: "18px",
                        margin: "auto",
                      }}
                    />
                  </button>
                </div>
              )}
              {isExpanded && (
                <div
                  contentEditable="true"
                  suppressContentEditableWarning
                  onInput={handleTitleInput}
                  onPaste={handlePaste}
                  ref={titleRef}
                  className="title-input editable-title"
                  role="textbox"
                  tabIndex="0"
                  aria-multiline="true"
                  aria-label="Title"
                  spellCheck="false"
                />
              )}

              <div
                contentEditable
                suppressContentEditableWarning
                onInput={handleContentInput}
                onPaste={handlePaste}
                ref={contentRef}
                onClick={() => setIsExpanded(true)}
                className={`content-input editable-content ${
                  !isExpanded ? "expanded" : ""
                }`}
                role="textbox"
                tabIndex="0"
                aria-multiline="true"
                aria-label="Take a note..."
                spellCheck="false"
              />
            </div>
            {isExpanded && (
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
                    selectedColor={selectedColor}
                    setSelectedColor={setSelectedColor}
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
                      onClick={() => {
                        uploadRef.current.click();
                      }}
                    >
                      <input
                        style={{ display: "none" }}
                        ref={uploadRef}
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
                        setIsArchived((prev) => !prev);
                        setArchSnackOpen(true);
                      }}
                    >
                      {isArchived ? (
                        <ArchivedIcon check={selectedColor} />
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
                  type="button"
                  className="close-button"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>

        {height < 100 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="no-notes"
            >
              <NoteIcon
                style={{ width: "100px", height: "100px", padding: "30px" }}
                color="#e5e5e5"
              />
              <h3
                style={{
                  fontFamily: "Open Sans",
                  fontSize: "1.375rem",
                  color: "rgb(95,99,104)",
                  fontWeight: "400",
                  marginBottom: "100px",
                }}
              >
                {" "}
                Notes you add appear here{" "}
              </h3>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <ArchSnack
        ref={snackRef}
        open={archSnackOpen}
        setIsOpen={setArchSnackOpen}
        isArchived={isArchived}
        setIsArchived={setIsArchived}
      />
      <ImageSnack
        ref={imageSnackRef}
        open={imageSnackOpen}
        setIsOpen={setImageSnackOpen}
        setImage={setImage}
        imageFile={imageFile}
        uploadRef={uploadRef}
        setImageEvent={setImageEvent}
        setIsExpanded={setIsExpanded}
      />
    </>
  );
};

export default CreateNote;
