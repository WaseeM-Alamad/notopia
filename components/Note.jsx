import React, { useEffect, useState, useRef, useCallback } from "react";
import ColorSelectMenu from "./ColorSelectMenu";
import "@/assets/styles/Note.css";
import Pin from "./Pin";
import PinClicked from "./PinClicked";
import { IconButton, LinearProgress, Tooltip } from "@mui/material";
import ArchiveIcon from "./ArchiveIcon";
import ArchivedIcon from "./ArchivedIcon";
import ReminderIcon from "./ReminderIcon";
import ImageIcon from "./ImageIcon";
import PersonAddIcon from "./PersonAdd";
import CheckMarkIcon from "./CheckMarkIcon";
import { fetchNotes } from "@/utils/requests";
import DropMenu from "./DropMenu";
import fetchNoteID from "@/actions/fetchNoteID";
import { Box } from "@mui/system";
import DeleteSnack from "./DeleteNoteSnack";
import replaceImage from "@/actions/replaceImage";
import NoteModal from "./NoteModal";

const Note = React.memo(
  ({
    note,
    isGridLayout,
    isotopeRef,
    selectedNotesIDs,
    setSelectedNotesIDs,
    updates,
    colorTrigger,
    pinTrigger,
    setNotes,
    userID,
    archivedTrigger,
    imagePending,
    setImagePending,
    loadingNoteID,
    setIsLoading,
  }) => {
    const [opacity, setOpacity] = useState("0");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedColor, setSelectedColor] = useState(note.color);
    const [boxShadow, setBoxShadow] = useState("none");
    const [noteDisplay, setNoteDisplay] = useState(true);
    const [noteOpacity, setNoteOpacity] = useState(true);
    const [isPinnedNote, setIsPinnedNote] = useState(note.isPinned);
    const [pinHover, setPinHover] = useState(false);
    const [Archived, setArchived] = useState(note.isArchived);
    const [isTrash, setIsTrash] = useState(note.isTrash);
    const [checkSelect, setCheckSelect] = useState(false);
    const [dropMenuOpen, setDropMenuOpen] = useState(false);
    const [isDeleteSnackOpen, setIsDeleteSnackOpen] = useState(false);
    const [image, setImage] = useState(note.image);
    const [noteImagePending, setNoteImagePending] = useState(false);
    const [srcDate, setSrcDate] = useState(Date.now());
    const isRemoteImage =
      image?.startsWith("http") || image?.startsWith("https");
    const noteRef = useRef(null);
    const menuRef = useRef(null);
    const dropMenuRef = useRef(null);
    const checkRef = useRef(null);
    const toolRef = useRef(null);
    const pinRef = useRef(null);
    const isFirstRun = useRef(true);
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
          opacity: "0",
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

    const [divPosition, setDivPosition] = useState({
      x: 0,
      y: 0,
    });
    const [divSize, setDivSize] = useState({
      width: 0,
      height: 0,
    });
    const [trigger, setTrigger] = useState(false);
    const [passedTrigger, setPassedTrigger] = useState(false);
    const [opacityM, setOpacityM] = useState(true);

    const getDivPosition = () => {
      if (noteRef.current) {
        const rect = noteRef.current.getBoundingClientRect();
        setDivPosition({
          x: rect.left, // Distance from the left of the viewport
          y: rect.top, // Distance from the top of the viewport
        });
        setDivSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    useEffect(() => {
      getDivPosition();
    }, [trigger]);

    useEffect(() => {
      const handleBeforeUnload = (e) => {
        if (imagePending) {
          const message =
            "Your content is still loading. Are you sure you want to leave?";
          e.returnValue = message; // Standard for most browsers
          return message; // For some older browsers
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);

      // Clean up the event listener
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }, [imagePending]);

    useEffect(() => {
      function handler(e) {
        if (noteRef.current && !noteRef.current.contains(e.target)) {
          setOpacity(0);
        }
      }
      document.addEventListener("mousedown", handler);

      return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
      const handleResize = () => {
        setIsOpen(false);
        setDropMenuOpen(false);
        setOpacity("0");
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    const handleMO = useCallback((e) => {
      setOpacity("100");
      if (
        !menuRef.current?.contains(e.target) &&
        !dropMenuRef.current?.contains(e.target)
      )
        setBoxShadow(
          "0 1px 2px 0 rgba(60,64,67,0.3),0 1px 3px 1.5px rgba(60,64,67,0.15)"
        );
    }, []);

    const loadNotes = async () => {
      const fetchedNotes = await fetchNotes(userID);
      setNotes(fetchedNotes);
    };

    const handleML = () => {
      if (!isOpen && !dropMenuOpen) setOpacity("0");
      setBoxShadow("none");
    };

    const handleMenuHover = useCallback(() => {
      setBoxShadow("none");
    }, []);

    const handleColorSelect = (color) => {
      if (color !== selectedColor) {
        setSelectedColor(color);

        handleUpdate("color", color);
      }
    };

    const handleUpdate = async (field, value) => {
      const noteID = await fetchNoteID(note.uuid);
      const formData = new FormData();
      formData.append(field, value);

      try {
        if (field !== "image") {
          setIsLoading(true);
        }

        await fetch(`/api/notes/${noteID?.replace(/"/g, "")}`, {
          method: "PATCH",
          body: formData,
        });
        if (field !== "image") {
          setTimeout(() => {
            setIsLoading(false);
          }, 700);
        }
      } catch (error) {
        console.log("Error updating note:", error);
      }
    };

    useEffect(() => {
      if (selectedNotesIDs?.length === 0) {
        setCheckSelect(false);
      }
    }, [selectedNotesIDs]);

    const handleSelect = () => {
      setCheckSelect((prev) => !prev);

      setSelectedNotesIDs((prevNotes) => {
        if (!prevNotes.some((arrayNote) => arrayNote.uuid === note.uuid)) {
          return [...prevNotes, note];
        }
        return prevNotes;
      });
    };

    useEffect(() => {
      if (!checkSelect) {
        setSelectedNotesIDs((prevNotes) =>
          prevNotes.filter((arrayNote) => arrayNote.uuid !== note.uuid)
        );
      }
    }, [checkSelect]);

    const handleNoteSelect = (e) => {
      if (
        !toolRef.current.contains(e.target) &&
        !checkRef.current.contains(e.target) &&
        !pinRef.current.contains(e.target)
      ) {
        setCheckSelect((prev) => !prev);

        setSelectedNotesIDs((prevNotes) => {
          if (!prevNotes.includes(note.uuid)) {
            return [...prevNotes, note];
          }
          return prevNotes;
        });
      }
    };

    useEffect(() => {
      setIsPinnedNote(note.isPinned);
    }, []);

    useEffect(() => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }

      if (selectedNotesIDs.some((arrayNote) => arrayNote.uuid === note.uuid)) {
        console.log("Pin: " + updates?.isPinned);
        setIsPinnedNote(updates?.isPinned);
      }
    }, [pinTrigger]);

    useEffect(() => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }

      if (selectedNotesIDs.some((arrayNote) => arrayNote.uuid === note.uuid)) {
        console.log("Color: " + updates?.color);
        setSelectedColor(updates?.color);
      }
    }, [colorTrigger]);

    useEffect(() => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }

      if (selectedNotesIDs.some((arrayNote) => arrayNote.uuid === note.uuid)) {
        console.log("Archived: " + updates?.isArchived);
        setArchived(updates?.isArchived);
      }
    }, [archivedTrigger]);

    const [height, setHeight] = useState(0);

    useEffect(() => {
      const calculateHeight = () => {
        if (noteRef.current) {
          setHeight(noteRef.current.offsetHeight);
        }
      };

      const resizeObserver = new ResizeObserver(calculateHeight);

      if (noteRef.current) {
        resizeObserver.observe(noteRef.current);
      }

      // Initial calculation
      calculateHeight();
      // Cleanup
      return () => {
        if (noteRef.current) {
          resizeObserver.unobserve(noteRef.current);
        }
      };
    }, []);

    useEffect(() => {
      isotopeRef.current?.arrange();
    }, [height]);

    return (
      <>
        <div
          onClick={(e) => {
            if (
              !toolRef.current.contains(e.target) &&
              !checkRef.current.contains(e.target) &&
              !pinRef.current.contains(e.target)
            ) {
            setOpacityM(false);
            setTrigger((prev) => !prev);
            setTimeout(() => {
              setPassedTrigger(true);
            }, 0);
          }
          }}
        >
          <div
            onMouseLeave={handleML}
            onMouseOver={handleMO}
            style={{
              display: noteDisplay ? "" : "none",
              opacity: noteOpacity ? "1" : "0",
              backgroundColor: selectedColor,
              boxShadow: boxShadow,
              width: isGridLayout ? "37.5rem" : "240px",
              outline:
                selectedColor === "#FFFFFF"
                  ? checkSelect
                    ? "1px solid #202124"
                    : "1px solid #e0e0e0"
                  : checkSelect
                  ? " 1px solid #202124"
                  : !image
                  ? "1px solid " + selectedColor
                  : "1px solid transparent",

              border: !image
                ? checkSelect
                  ? "solid 1px #202124"
                  : "solid 1px transparent"
                : checkSelect
                ? "solid 1px #202124"
                : "solid 1px transparent",
            }}
            className="note note-header"
            onClick={(e) => {
              if (selectedNotesIDs.length > 0) {
                handleNoteSelect(e);
              }
            }}
            ref={noteRef}
            draggable="false"
          >
            <div
              style={{ position: image ? "absolute" : "" }}
              className="corner2"
            />
            <div
              className="checkmark"
              style={{ zIndex: "1", overflow: "visible" }}
            >
              <CheckMarkIcon
                checkSelect={checkSelect}
                checkRef={checkRef}
                style={{
                  opacity: checkSelect ? "1" : opacity,
                  transition: "opacity 0.22s linear",
                  cursor: "pointer",
                  borderRadius: "50%",
                  height: "22px",
                  width: "22px",
                }}
                color={checkSelect ? "#6f6f6f" : selectedColor}
                onClick={handleSelect}
              />
            </div>
            <Tooltip
              slotProps={slotProps}
              PopperProps={TooltipPosition}
              sx={{ zIndex: "100" }}
              title={isPinnedNote ? "Unpin note" : "Pin note"}
              disableInteractive
            >
              <IconButton
                ref={pinRef}
                disableTouchRipple
                sx={{
                  zIndex: "1",
                  opacity: checkSelect ? "1" : opacity,
                  "&:hover": { backgroundColor: "rgba(95, 99, 104, 0.157)" },
                }}
                id="note-pin"
                onMouseOver={() => setPinHover(true)}
                onMouseLeave={() => setPinHover(false)}
                onClick={() => {
                  setIsPinnedNote((prev) => !prev);
                  loadNotes();
                  handleUpdate("isPinned", !isPinnedNote);
                }}
              >
                <PinClicked
                  image={image}
                  pinImgDis={isPinnedNote ? "block" : "none"}
                  style={{
                    display: isPinnedNote ? "block" : "none",
                    opacity:
                      selectedColor !== "#FFFFFF"
                        ? !pinHover
                          ? "0.54"
                          : "1"
                        : "1",
                    transition: "opacity 0s ease-in",
                  }}
                  color={
                    !pinHover
                      ? selectedColor !== "#FFFFFF"
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
                  borderBottomLeftRadius:
                    note.title || note.content ? "0" : "0.5rem",
                  borderBottomRightRadius:
                    note.title || note.content ? "0" : "0.5rem",
                }}
              >
                <div
                  style={{
                    opacity: noteImagePending ? "0.6" : "1",
                    transition: "opacity 0.2s ease-in",
                  }}
                >
                  <img
                    style={{
                      width: "100%",
                      height: "100%",
                      marginBottom: "-4px",
                      userSelect: "none",
                      opacity:
                        imagePending && loadingNoteID === note.uuid
                          ? "0.6"
                          : "1",
                      transition: "opacity 0.2s ease-in",
                    }}
                    // draggable="false"
                    alt="image"
                    src={isRemoteImage ? `${image}?v=${srcDate}` : image}
                    draggable="false"
                  />
                </div>
                {imagePending && loadingNoteID === note.uuid && (
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

            {!image && !note.title && !note.content && (
              <div
                className="empty-note"
                aria-label="Empty note"
                spellCheck="false"
              />
            )}

            {(note.title || note.content) && (
              <div
                style={{ minHeight: !image ? "60px" : "" }}
                className="note-text"
              >
                {note.title && (
                  <h2 draggable="false" className="title noto-sans-bold">
                    {note.title}
                  </h2>
                )}

                {note.content && (
                  <h2 className="content noto-sans-regular">
                    {" "}
                    {note.content}{" "}
                  </h2>
                )}
              </div>
            )}

            {/* {selectedNotesIDs > 0 && ( */}
            <div
              style={{
                opacity: checkSelect ? "0" : opacity,
                visibility: selectedNotesIDs.length > 0 ? "hidden" : "visible",
                position: image && !note.title && !note.content && "absolute",
                bottom: image && !note.title && !note.content && "0px",
                backgroundColor:
                  image &&
                  !note.title &&
                  !note.content &&
                  "rgba(255,255,255,0.8)",

                borderBottomLeftRadius:
                  image && !note.title && !note.content && "0.5rem",
                borderBottomRightRadius:
                  image && !note.title && !note.content && "0.5rem",
                marginBottom: image && !note.title && !note.content && "0px",
                paddingTop:
                  image && !note.title && !note.content
                    ? "3px"
                    : image && !note.title
                    ? "0px"
                    : "4px",
                paddingBottom:
                  image && !note.title && !note.content ? "3px" : "4px",
                paddingLeft: isGridLayout ? "10px" : "",
                gap: isGridLayout ? "13px" : "0",
                width: isGridLayout ? "calc(100% - 10px)" : "100%",
              }}
              className="noteBottom"
              ref={toolRef}
            >
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                sx={{ zIndex: "100" }}
                title="Remind me"
                disableInteractive
              >
                <div style={{ margin: "auto" }}>
                  <IconButton
                    disableTouchRipple
                    sx={{
                      width: "34px",
                      height: "34px",
                      padding: "6px",
                      "&:hover": {
                        backgroundColor: "rgba(95, 99, 104, 0.157)",
                      },
                    }}
                  >
                    <ReminderIcon />
                  </IconButton>
                </div>
              </Tooltip>
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                sx={{ zIndex: "100" }}
                title="Collaborator"
                disableInteractive
              >
                <div style={{ margin: "auto" }}>
                  <IconButton
                    disableTouchRipple
                    sx={{
                      width: "34px",
                      height: "34px",
                      padding: "6px",
                      "&:hover": {
                        backgroundColor: "rgba(95, 99, 104, 0.157)",
                      },
                    }}
                  >
                    <PersonAddIcon />
                  </IconButton>
                </div>
              </Tooltip>
              <div style={{ margin: "auto" }}>
                <ColorSelectMenu
                  menuRef={menuRef}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  handleMenuHover={handleMenuHover}
                  selectedColor={selectedColor}
                  setSelectedColor={setSelectedColor}
                  handleColorSelect={handleColorSelect}
                />
              </div>
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                disableHoverListener={imagePending || noteImagePending}
                title="Add image"
                disableInteractive
              >
                <div style={{ margin: "auto" }}>
                  <input
                    style={{ display: "none" }}
                    ref={uploadRef}
                    type="file"
                    id="single"
                    accept=".gif,.jpeg,.jpg,.png,image/gif,image/jpeg,image/jpg,image/png"
                    onChange={(event) => {
                      const file = event.target.files[0];
                      setImage(URL.createObjectURL(file));
                      handleUpdate(
                        "image",
                        `https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia/${userID}/${note.uuid}`
                      );
                      replaceImage(
                        event,
                        note.uuid,
                        userID,
                        image,
                        setNoteImagePending,
                        setIsLoading
                      );
                      uploadRef.current.value = "";
                    }}
                  />
                  <IconButton
                    disableTouchRipple
                    disabled={imagePending || noteImagePending}
                    onClick={() => {
                      uploadRef.current?.click();
                    }}
                    sx={{
                      width: "34px",
                      height: "34px",
                      padding: "6px",
                      "&:hover": {
                        backgroundColor: "rgba(95, 99, 104, 0.157)",
                      },
                    }}
                  >
                    <ImageIcon />
                  </IconButton>
                </div>
              </Tooltip>
              <Tooltip
                slotProps={slotProps}
                PopperProps={TooltipPosition}
                sx={{ zIndex: "100" }}
                title={Archived ? "Archived" : "Archive"}
                disableInteractive
              >
                <div style={{ margin: "auto" }}>
                  <IconButton
                    disableTouchRipple
                    sx={{
                      width: "34px",
                      height: "34px",
                      padding: "6px",
                      "&:hover": {
                        backgroundColor: "rgba(95, 99, 104, 0.157)",
                      },
                    }}
                    onClick={() => {
                      setArchived((prev) => !prev);
                      handleUpdate("isArchived", !Archived);
                    }}
                  >
                    {Archived ? (
                      <ArchivedIcon check={selectedColor} />
                    ) : (
                      <ArchiveIcon />
                    )}
                  </IconButton>
                </div>
              </Tooltip>

              <div style={{ margin: "auto" }}>
                <DropMenu
                  handleMenuHover={handleMenuHover}
                  dropMenuRef={dropMenuRef}
                  isotopeRef={isotopeRef}
                  open={dropMenuOpen}
                  setOpen={setDropMenuOpen}
                  setNoteDisplay={setNoteDisplay}
                  setNoteOpacity={setNoteOpacity}
                  Noteuuid={note.uuid}
                  userID={userID}
                  setIsTrash={setIsTrash}
                  isTrash={isTrash}
                  handleUpdate={handleUpdate}
                  setIsLoading={setIsLoading}
                  setIsDeleteSnackOpen={setIsDeleteSnackOpen}
                />
              </div>
              {/* <DropMenu /> */}
            </div>
            {/* )} */}
          </div>
        </div>
        <DeleteSnack
          isotopeRef={isotopeRef}
          setNoteDisplay={setNoteDisplay}
          setNoteOpacity={setNoteOpacity}
          setIsLoading={setIsLoading}
          handleUpdate={handleUpdate}
          setIsTrash={setIsTrash}
          open={isDeleteSnackOpen}
          setIsOpen={setIsDeleteSnackOpen}
        />
        <NoteModal
          divPosition={divPosition}
          divSize={divSize}
          trigger={passedTrigger}
          setTrigger={setPassedTrigger}
          setOpacity={setOpacity}
        />
      </>
    );
  }
);

export default Note;
