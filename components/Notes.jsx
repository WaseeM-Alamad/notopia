"use client";
import { fetchNotes } from "@/utils/requests";
import React, { useEffect, useRef, useState } from "react";
import CreateNote from "./CreateNote";
import Note from "./Note";
import Isotope from "isotope-layout";
import "@/assets/styles/Notes.css";
import { redirect, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import "@/assets/styles/TopMenu.css";
import { motion, AnimatePresence } from "framer-motion";
import { IconButton, Tooltip } from "@mui/material";
import { Close } from "@mui/icons-material";
import TopPin from "./TopPin";
import TopReminder from "./TopReminder";
import TopArchive from "./TopArchive";
import TopMore from "./TopMore";
import ColorSelectMenu from "./ColorSelectMenuTop";
import { useAppContext } from "@/context/AppContext";

const Notes = ({ initialNotes }) => {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedNotesIDs, setSelectedNotesIDs] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState(0);
  const [updates, setUpdates] = useState({
    isPinned: false,
    isArchived: false,
    color: "#FFFFFF",
  });
  const [imagePending, setImagePending] = useState(false);
  const [loadingNoteID, setLoadingNoteID] = useState();
  const [height, setHeight] = useState(0);
  const [colorTrigger, setColorTrigger] = useState(false);
  const [pinTrigger, setPinTrigger] = useState(false);
  const [archivedTrigger, setArchivedTrigger] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColorTop, setSelectedColorTop] = useState("#FFFFFF");
  const isFirstRun = useRef(true);
  const [pinFill, setPinFill] = useState();
  const gridRef = useRef(null);
  const isotopeRef = useRef(null);
  const topMenuRef = useRef(null);
  const noteWrapperRef = useRef(null);
  const ColorMenuRef = useRef(null);
  const SearchParams = useSearchParams();
  const searchTerm = SearchParams.get("Search" || "");
  const { data: session, status } = useSession();
  const userID = session?.user?.id;

  const {isLoading, setIsLoading} = useAppContext();
  const { loadTrigger } = useAppContext();

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

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  const loadNotes = async () => {
    setIsLoading(true);
    const fetchedNotes = await fetchNotes(userID);
    setNotes(fetchedNotes);
    setTimeout(() => {
      setIsLoading(false);  
    }, 700);
    
  };
  
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    loadNotes();
  }, [loadTrigger]);

  useEffect(() => {
    // Update the Isotope layout when notes change
    if (isotopeRef.current) {
      isotopeRef.current.reloadItems();

      isotopeRef.current.arrange({
        sortBy: "Category",
        sortAscending: true,
      });
    }
  }, [notes]);

  useEffect(() => {
    // Initialize Isotope after notes are loaded
    if (gridRef.current) {
      isotopeRef.current = new Isotope(gridRef.current, {
        itemSelector: ".grid-item",
        masonry: {
          columnWidth: 240,
          gutter: 14,
        },
        percentPosition: true,
        horizontalOrder: false,
        transitionDuration: 200,
        stagger: 1,
        layoutMode: "masonry",
        getSortData: {
          Category: "[data-category]",
        },
      });
    }

    // Cleanup the Isotope instance on component unmount
    return () => {
      if (isotopeRef.current) {
        isotopeRef.current.destroy();
      }
    };
  }, []);

  // Optional: handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isotopeRef.current) {
        isotopeRef.current.arrange();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const [isGridLayout, setIsGridLayout] = useState(()=> {
    const isGridLayout = localStorage.getItem("isGridLayout");
    return isGridLayout === "true";
  });

  useEffect(() => {
    
    // Listen for the custom 'layoutChange' event to update the layout dynamically
    const handleLayoutChange = (event) => {
      setIsGridLayout(event.detail);
    };

    window.addEventListener("layoutChange", handleLayoutChange);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("layoutChange", handleLayoutChange);
    };
  }, []);

  useEffect(() => {
    if (isotopeRef.current) {
      setTimeout(() => {
        isotopeRef.current.arrange();
      }, 400);
    }
  }, [isGridLayout]);

  const handleClearSelection = () => {
    setSelectedNotesIDs([]);
  };

  useEffect(() => {
    setSelectedNumber((prev) => {
      if (selectedNotesIDs.length === 0) {
        return prev;
      } else {
        return selectedNotesIDs.length;
      }
    });
    console.log("ENTERED");
    setUpdates((prev) => ({
      ...prev,
      isArchived:
        selectedNotesIDs.length === 0
          ? false
          : selectedNotesIDs.every((note) => note.isArchived)
          ? true
          : false,
    }));
  }, [selectedNotesIDs.length]);

  useEffect(() => {
    console.log(selectedNotesIDs);
    if (selectedNotesIDs.length === 0) {
      return;
    }

    const allPinned = selectedNotesIDs.every((note) => note.isPinned);
    setUpdates((prev) => ({ ...prev, isPinned: allPinned }));
    setPinFill(allPinned);

    if (!allPinned) {
      setUpdates((prev) => ({ ...prev, isPinned: false }));
    }
  }, [selectedNotesIDs.length, selectedNotesIDs]);

  useEffect(() => {
    const handler = (event) => {
      const target = event.target.closest(
        ".pinned-grid-item, .grid-item, .top-menu"
      );

      if (!target && selectedNotesIDs.length > 0) {
        setSelectedNotesIDs([]);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [selectedNotesIDs.length]);

  const updateSelectedNotesIDs = async (updates) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append(
        "selectedNotesIDs",
        selectedNotesIDs.map((note) => note.uuid).join(",")
      );

      if (updates.hasOwnProperty("isPinned"))
        formData.append("isPinned", updates.isPinned);
      if (updates.hasOwnProperty("isArchived"))
        formData.append("isArchived", updates.isArchived);
      if (updates.hasOwnProperty("color"))
        formData.append("color", updates.color);

      const response = await fetch("/api/notes/batch-update", {
        method: "PATCH",
        body: formData,
      });
      setTimeout(() => {
        setIsLoading(false);
      }, 700);
      if (!response.ok) {
        throw new Error("Failed to update notes");
      }
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColorTop(color);
    setColorTrigger((prev) => !prev);
    setUpdates((prev) => ({ ...prev, color: color }));
    const update = { color: color };
    updateSelectedNotesIDs(update);
  };

  const handlePinClick = () => {
    setPinTrigger((prev) => !prev);
    isotopeRef.current.arrange({
      sortBy: "Category",
      sortAscending: false,
    });
    const newIsPinned = !updates.isPinned;
    setUpdates((prev) => ({ ...prev, isPinned: newIsPinned }));
    setPinFill(newIsPinned);
    updateSelectedNotesIDs({ isPinned: newIsPinned });
    setTimeout(() => {
      setSelectedNotesIDs([]);
    }, 0);
  };

  const handleArchiveClick = () => {
    setArchivedTrigger((prev) => !prev);
    const newIsArchived = !updates.isArchived;
    setUpdates((prev) => ({ ...prev, isArchived: newIsArchived }));
    updateSelectedNotesIDs({ isArchived: newIsArchived });
    setTimeout(() => {
      setSelectedNotesIDs([]);
    }, 0);
  };

  useEffect(() => {
    const calculateHeight = () => {
      if (gridRef.current) {
        setHeight(gridRef.current.offsetHeight);
      }
    };

    const resizeObserver = new ResizeObserver(calculateHeight);

    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    // Initial calculation
    calculateHeight();
    // Cleanup
    return () => {
      if (gridRef.current) {
        resizeObserver.unobserve(gridRef.current);
      }
    };
  }, []);

  const handleLoad = async () => {
    setIsLoading(true);
    await loadNotes();
    setTimeout(() => {
      setIsLoading(false);
    }, 700);
  };

  const [sideTrigger, setSideTrigger] = useState(()=> {
    const sideTrigger = localStorage.getItem("sideBarTrigger");
    console.log("side Trigger: "  + sideTrigger);
    return sideTrigger === "true";
  });

  useEffect(() => {
    const handler = (event) => {
      setSideTrigger(event.detail);
    };

    window.addEventListener("sideBarTrigger", handler);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("sideBarTrigger", handler);
    };
  }, []);

  useEffect(() => {
    isotopeRef.current?.arrange();
  }, [sideTrigger]);

  return (
    <>
      <AnimatePresence>
        <motion.div
          ref={topMenuRef}
          className="top-menu"
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: selectedNotesIDs.length > 0 ? 1 : 0,
            y: selectedNotesIDs.length > 0 ? 0 : -20,
            visibility: selectedNotesIDs.length > 0 ? "visible" : "hidden",
          }}
          transition={{
            opacity: { duration: 0.2, ease: "easeInOut" },
            y: { duration: 0.3, stiffness: 130, damping: 20 },
          }}
        >
          <Tooltip
            slotProps={slotProps}
            PopperProps={TooltipPosition}
            title="Clear selection"
          >
            <IconButton
              onClick={handleClearSelection}
              sx={{
                "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
                marginLeft: "0.2em",
              }}
              disableTouchRipple
            >
              <Close sx={{ padding: "8.5px" }} />
            </IconButton>
          </Tooltip>
          <h2 className="selected"> {selectedNumber} Selected </h2>
          <div className="top-menu-tools">
            <Tooltip
              slotProps={slotProps}
              PopperProps={TooltipPosition}
              title="Pin note"
              disableInteractive
            >
              <IconButton
                sx={{
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
                  padding: "10.5px",
                }}
                disableTouchRipple
                onClick={handlePinClick}
              >
                <TopPin pinFill={pinFill} />
              </IconButton>
            </Tooltip>
            <Tooltip
              slotProps={slotProps}
              PopperProps={TooltipPosition}
              title="Remind me"
              disableInteractive
            >
              <IconButton
                sx={{
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
                  padding: "10.5px",
                }}
                disableTouchRipple
              >
                <TopReminder />
              </IconButton>
            </Tooltip>

            <ColorSelectMenu
              ColorMenuRef={ColorMenuRef}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              handleColorSelect={handleColorSelect}
              selectedColorTop={selectedColorTop}
              setSelectedColorTop={setSelectedColorTop}
            />

            <Tooltip
              slotProps={slotProps}
              PopperProps={TooltipPosition}
              title="Archive"
              disableInteractive
            >
              <IconButton
                sx={{
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
                  padding: "10.5px",
                }}
                disableTouchRipple
                onClick={handleArchiveClick}
              >
                <TopArchive />
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
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
                  padding: "10.5px",
                }}
                disableTouchRipple
              >
                <TopMore />
              </IconButton>
            </Tooltip>
          </div>
        </motion.div>
      </AnimatePresence>

      <div
        style={{ marginLeft: sideTrigger ? "300px" : "" }}
        className="content-wrapper"
      >
        <CreateNote
          setImagePending={setImagePending}
          setLoadingNoteID={setLoadingNoteID}
          setIsLoading={setIsLoading}
          userID={userID}
          setNotes={setNotes}
          height={height}
        />

        <div className="notes-wrapper">
          <div
            style={{
              width: isGridLayout ? "37.5rem" : "98%",
            }}
            className="inner-notes-wrapper"
          >
            <div ref={gridRef} className="grid">
              {[...notes].reverse().map((note) => {
                if (!note.isTrash) {
                  return (
                    <div
                      ref={noteWrapperRef}
                      key={note.uuid}
                      className={`grid-item`}
                      data-category={note.isPinned ? "pinned" : "unpinned"}
                    >
                      <Note
                        selectedNotesIDs={selectedNotesIDs}
                        setSelectedNotesIDs={setSelectedNotesIDs}
                        isGridLayout={isGridLayout}
                        isotopeRef={isotopeRef}
                        note={note}
                        updates={updates}
                        colorTrigger={colorTrigger}
                        pinTrigger={pinTrigger}
                        archivedTrigger={archivedTrigger}
                        setNotes={setNotes}
                        userID={userID}
                        imagePending={imagePending}
                        setImagePending={setImagePending}
                        loadingNoteID={loadingNoteID}
                        setIsLoading={setIsLoading}
                      />
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>
      
    </>
  );
};

export default Notes;
