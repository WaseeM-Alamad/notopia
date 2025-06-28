import Button from "@/components/Tools/Button";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import ColorSelectMenu from "../ColorSelectMenu";
import {
  batchCopyNoteAction,
  batchDeleteNotes,
  batchUpdateAction,
  NoteUpdateAction,
  undoAction,
} from "@/utils/actions";
import MoreMenu from "../MoreMenu";
import { useAppContext } from "@/context/AppContext";
import { v4 as uuid } from "uuid";
import { useSession } from "next-auth/react";
import ManageTopLabelsMenu from "../ManageTopLabelsMenu";
import DeleteModal from "../DeleteModal";
import { useSearch } from "@/context/SearchContext";

const TopMenuHome = ({
  notes,
  fadeNote,
  visibleItems,
  setVisibleItems,
  dispatchNotes,
  openSnackFunction,
  setFadingNotes,
  selectedNotesIDs,
  setSelectedNotesIDs,
  setTooltipAnchor,
  isDraggingRef,
  rootContainerRef,
  functionRefs,
  currentSection,
}) => {
  const { batchNoteCount } = useAppContext();
  const { filters } = useSearch();
  const { data: session } = useSession();
  const userID = session?.user?.id;
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [inTrash, setInTrash] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBG, setSelectedBG] = useState(null);
  const [pinNotes, setPinNotes] = useState(false);
  const [archiveNotes, setArchiveNotes] = useState(false);
  const [selectedColor, setSelectedColor] = useState();
  const topMenuRef = useRef(null);
  const selectedNotesRef = useRef(null);
  const initialColorRef = useRef(null);

  const hasLabels = () => {
    const labelsExist = selectedNotesIDs.some((noteData) => {
      const note = notes.get(noteData.uuid);
      return !!note.labels.length;
    });
    return labelsExist;
  };

  const handleClose = () => {
    closeToolTip();
    setSelectedNotesIDs([]);
    setMoreMenuOpen(false);
    setLabelsOpen(false);
    setColorMenuOpen(false);
    window.dispatchEvent(new Event("topMenuClose"));
  };

  useEffect(() => {
    if (
      selectedNotesIDs.length > 0 &&
      !rootContainerRef.current?.classList.contains("selected-notes")
    ) {
      const firstItem = selectedNotesIDs[0];
      const val = notes.get(firstItem.uuid).isTrash;
      setInTrash(val);

      rootContainerRef.current?.classList.add("selected-notes");
    }

    if (selectedNotesIDs.length === 0) {
      rootContainerRef.current?.classList.remove("selected-notes");
    }

    const handler = (e) => {
      if (
        !isDraggingRef.current &&
        selectedNotesIDs.length > 0 &&
        !e.target.closest(".note") &&
        !e.target.closest("nav") &&
        !e.target.closest(".top-menu") &&
        !e.target.closest("aside") &&
        !e.target.closest(".color-menu") &&
        !rootContainerRef.current?.classList.contains("dragging")
      ) {
        handleClose();
      }
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  }, [selectedNotesIDs]);

  useEffect(() => {
    if (selectedNotesIDs.length > 0) {
      selectedNotesRef.current = selectedNotesIDs;
    } else {
      setColorMenuOpen(false);
      setMoreMenuOpen(false);
      setLabelsOpen(false);
    }
  }, [selectedNotesIDs]);

  useEffect(() => {
    const length = selectedNotesIDs.length;

    if (length === 0) {
      return;
    } else {
      let sharedColor = new Set();
      let sharedBG = new Set();
      let pinned = null;
      let archived = null;
      selectedNotesIDs.forEach((noteData) => {
        const note = notes.get(noteData.uuid);
        const color = note.color;
        const bg = note.background;

        if (pinned !== false) {
          pinned = note.isPinned ? true : false;
        }
        if (archived !== false) {
          archived = note.isArchived ? true : false;
        }
        sharedColor.add(color);
        sharedBG.add(bg);
      });
      setPinNotes(pinned);
      setArchiveNotes(!archived);
      if (sharedColor.size === 1) {
        setSelectedColor([...sharedColor][0]);
        initialColorRef.current = [...sharedColor][0];
      } else {
        setSelectedColor(null);
        initialColorRef.current = null;
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
    closeToolTip();
    if (selectedColor === newColor) return;
    if (!filters.color) {
      dispatchNotes({
        type: "BATCH_UPDATE_COLOR",
        selectedNotes: selectedNotesIDs,
        color: newColor,
      });
    }
    setSelectedColor(newColor);
    const UUIDS = selectedNotesIDs.map((data) => data.uuid);
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction({
      type: "color",
      value: newColor,
      noteUUIDs: UUIDS,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  useEffect(() => {
    if (!colorMenuOpen) {
      if (
        filters.color &&
        selectedColor &&
        initialColorRef.current !== selectedColor
      ) {
        const selectedNotes = selectedNotesRef.current;
        const selectedUUIDs = selectedNotes.map(({ uuid }) => uuid);
        setFadingNotes(new Set(selectedUUIDs));
        setTimeout(() => {
          console.log("idk man");
          dispatchNotes({
            type: "BATCH_UPDATE_COLOR",
            selectedNotes: selectedNotes,
            color: selectedColor,
          });
          setFadingNotes(new Set());
          setVisibleItems((prev) => {
            const updated = new Set(prev);
            selectedUUIDs.forEach((uuid) => {
              updated.delete(uuid);
            });
            return updated;
          });
        }, 250);
      }
      setSelectedNotesIDs([]);
      initialColorRef.current = null;
    }
  }, [colorMenuOpen]);

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
    await NoteUpdateAction({
      type: "background",
      value: newBG,
      noteUUIDs: UUIDS,
    });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleArchive = async () => {
    const firstItem = selectedNotesIDs[0];
    const val = notes.get(firstItem.uuid).isArchived;
    const length = selectedNotesIDs.length;
    let clearSet = false;

    const selectedUUIDs = selectedNotesIDs.map(({ uuid }) => {
      if (!visibleItems.has(uuid)) clearSet = true;
      return uuid;
    });

    if (clearSet) {
      setVisibleItems(new Set());
      window.dispatchEvent(new Event("reloadNotes"));
    }

    const redo = async () => {
      if (fadeNote) {
        setFadingNotes(new Set(selectedUUIDs));
      }

      setTimeout(
        () => {
          dispatchNotes({
            type: "BATCH_ARCHIVE/TRASH",
            selectedNotes: selectedNotesIDs,
            property: "isArchived",
            val: val,
          });
          setFadingNotes(new Set());
          if (fadeNote && !clearSet) {
            setVisibleItems((prev) => {
              const updated = new Set(prev);
              selectedUUIDs.forEach((uuid) => {
                updated.delete(uuid);
              });
              return updated;
            });
          }
        },
        fadeNote ? 250 : 0
      );

      window.dispatchEvent(new Event("loadingStart"));

      batchUpdateAction({
        type: "BATCH_ARCHIVE/TRASH",
        selectedNotes: selectedNotesIDs,
        property: "isArchived",
        val: val,
      }).then(() => window.dispatchEvent(new Event("loadingEnd")));
    };

    redo();

    const undo = () => {
      window.dispatchEvent(new Event("loadingStart"));

      undoAction({
        type: "UNDO_BATCH_ARCHIVE/TRASH",
        selectedNotes: selectedNotesIDs,
        property: "isArchived",
        val: val,
      }).then(() => window.dispatchEvent(new Event("loadingEnd")));
      if (fadeNote && !clearSet) {
        setVisibleItems((prev) => {
          const updated = new Set(prev);
          selectedUUIDs.forEach((uuid) => {
            updated.add(uuid);
          });
          return updated;
        });
      }

      dispatchNotes({
        type: "UNDO_BATCH_ARCHIVE/TRASH",
        selectedNotes: selectedNotesIDs,
        property: "isArchived",
        val: val,
        length: length,
      });
    };

    const snackMessage =
      length === 1 ? "Note archived" : `${length} notes archived`;

    openSnackFunction({
      snackMessage: snackMessage,
      snackOnUndo: undo,
      snackRedo: redo,
    });

    handleClose();
  };

  const handlePin = () => {
    handleClose();

    const selectedUUIDs = selectedNotesIDs.map((data) => data.uuid);
    const firstItem = selectedNotesIDs[0];
    const ArchiveVal =
      currentSection.toLowerCase() === "archive" &&
      notes.get(firstItem.uuid).isArchived;
    const clearSet = selectedNotesIDs.some(
      (item) => !visibleItems.has(item.uuid)
    );

    if (clearSet) {
      setVisibleItems(new Set());
      window.dispatchEvent(new Event("reloadNotes"));
    }

    requestAnimationFrame(() => {
      if (ArchiveVal) {
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

          ArchiveVal &&
            setVisibleItems((prev) => {
              const updated = new Set(prev);
              selectedUUIDs.forEach((uuid) => {
                updated.add(uuid);
              });
              return updated;
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
          ArchiveVal &&
            setVisibleItems((prev) => {
              const updated = new Set(prev);
              selectedUUIDs.forEach((uuid) => {
                updated.delete(uuid);
              });
              return updated;
            });
        },
        ArchiveVal ? 250 : 0
      );
      window.dispatchEvent(new Event("loadingStart"));
      batchUpdateAction({
        type: "BATCH_PIN",
        selectedNotes: selectedNotesIDs,
        val: pinNotes,
      }).then(() => window.dispatchEvent(new Event("loadingEnd")));
    });
  };

  const handleOpenMenu = (e) => {
    setAnchorEl(e.currentTarget);
    setMoreMenuOpen((prev) => !prev);
    setLabelsOpen(false);
  };

  const handleTrashNotes = () => {
    const firstItem = selectedNotesIDs[0];
    const val = notes.get(firstItem.uuid).isTrash;
    const length = selectedNotesIDs.length;

    const selectedUUIDs = selectedNotesIDs.map(({ uuid }) => uuid);

    const redo = async () => {
      setFadingNotes((prev) => new Set([...prev, ...selectedUUIDs]));

      setTimeout(() => {
        dispatchNotes({
          type: "BATCH_ARCHIVE/TRASH",
          selectedNotes: selectedNotesIDs,
          property: "isTrash",
          val: val,
        });
        setFadingNotes(new Set());
        setVisibleItems((prev) => {
          const updated = new Set(prev);
          selectedUUIDs.forEach((uuid) => {
            updated.delete(uuid);
          });
          return updated;
        });
      }, 250);

      window.dispatchEvent(new Event("loadingStart"));

      batchUpdateAction({
        type: "BATCH_ARCHIVE/TRASH",
        selectedNotes: selectedNotesIDs,
        property: "isTrash",
        val: val,
      }).then(() => window.dispatchEvent(new Event("loadingEnd")));
    };

    redo();

    const undo = () => {
      window.dispatchEvent(new Event("loadingStart"));

      dispatchNotes({
        type: "UNDO_BATCH_ARCHIVE/TRASH",
        selectedNotes: selectedNotesIDs,
        property: "isTrash",
        val: val,
        length: length,
      });

      setVisibleItems((prev) => {
        const updated = new Set(prev);
        selectedUUIDs.forEach((uuid) => {
          updated.add(uuid);
        });
        return updated;
      });
      undoAction({
        type: "UNDO_BATCH_ARCHIVE/TRASH",
        selectedNotes: selectedNotesIDs,
        property: "isTrash",
        val: val,
      }).then(() => window.dispatchEvent(new Event("loadingEnd")));
    };

    const snackMessage =
      length === 1
        ? `Note ${val ? "restored" : "trashed"}`
        : `${length} notes ${val ? "restored" : "trashed"}`;

    openSnackFunction({
      snackMessage: snackMessage,
      snackOnUndo: undo,
      snackRedo: redo,
    });

    handleClose();
  };

  const handleDeleteNotes = async () => {
    let selectedUUIDs = [];
    let labelsToDec = [];

    selectedNotesIDs.forEach(({ uuid }) => {
      selectedUUIDs.push(uuid);
      const note = notes.get(uuid);
      if (note.labels.length > 0) {
        labelsToDec.push(...note.labels);
      }
    });

    batchNoteCount(labelsToDec);

    setFadingNotes(new Set(selectedUUIDs));
    setTimeout(() => {
      dispatchNotes({
        type: "BATCH_DELETE_NOTES",
        deletedUUIDs: selectedUUIDs,
      });
      setFadingNotes(new Set());
    }, 250);

    handleClose();

    window.dispatchEvent(new Event("loadingStart"));
    await batchDeleteNotes({ deletedUUIDs: selectedUUIDs });
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleMakeCopy = async () => {
    const newNotes = [];
    const newNotesUUIDs = [];
    const selectedUUIDs = [];
    const newUUIDs = [];
    const labelsUUIDs = [];
    const imagesMap = new Map();
    const imagesToDel = [];
    const length = selectedNotesIDs.length;

    const selectedNotes = selectedNotesIDs.sort((a, b) => b.index - a.index);

    selectedNotes.forEach(({ uuid: noteUUID }) => {
      const note = notes.get(noteUUID);
      const newNoteUUID = uuid();
      const newImages = [];
      const newCheckboxes = [];
      const oldToNewCBMap = new Map();

      if (note.images.length > 0) {
        note.images.forEach((image) => {
          const newImageUUID = uuid();
          const newImage = { uuid: newImageUUID, url: image.url };
          imagesMap.set(newImageUUID, `${note.uuid}/${image.uuid}`);
          imagesToDel.push(`${userID}/${newNoteUUID}/${newImageUUID}`);
          newImages.push(newImage);
        });
      }

      if (note.checkboxes.length > 0) {
        const copiedCheckboxes = note.checkboxes.map((checkbox) => {
          const newUUID = uuid();
          oldToNewCBMap.set(checkbox.uuid, newUUID);
          const newCheckbox = {
            ...checkbox,
            uuid: newUUID,
          };
          return newCheckbox;
        });

        copiedCheckboxes.forEach((checkbox) => {
          const newChildren = checkbox.children.map((childUUID) =>
            oldToNewCBMap.get(childUUID)
          );
          const finalCheckbox = {
            ...checkbox,
            children: newChildren,
          };
          newCheckboxes.push(finalCheckbox);
        });
      }

      const newNote = {
        uuid: newNoteUUID,
        title: note?.title,
        content: note.content,
        color: note.color,
        background: note.background,
        labels: note.labels,
        checkboxes: newCheckboxes,
        showCheckboxes: true,
        expandCompleted: note.expandCompleted,
        isPinned: false,
        isArchived: false,
        isTrash: note.isTrash,
        createdAt: new Date(),
        updatedAt: new Date(),
        textUpdatedAt: new Date(),
        images: newImages,
      };
      selectedUUIDs.push(noteUUID);
      newNotes.push(newNote);
      labelsUUIDs.push(...note.labels);
      newUUIDs.push(newNoteUUID);
      newNotesUUIDs.push(newNoteUUID);
    });

    setMoreMenuOpen(false);

    const redo = async () => {
      batchNoteCount(labelsUUIDs, "inc");

      dispatchNotes({
        type: "BATCH_COPY_NOTE",
        newNotes: newNotes,
      });

      setVisibleItems((prev) => new Set([...prev, ...newNotesUUIDs]));

      window.dispatchEvent(new Event("loadingStart"));
      await batchCopyNoteAction({ newNotes: newNotes, imagesMap: imagesMap });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    redo();

    const undo = async () => {
      setFadingNotes(new Set(newUUIDs));
      batchNoteCount(labelsUUIDs);
      setTimeout(() => {
        dispatchNotes({
          type: "UNDO_BATCH_COPY",
          notesToDel: newUUIDs,
          length: length,
        });
        setFadingNotes(new Set());
      }, 250);
      window.dispatchEvent(new Event("loadingStart"));
      await undoAction({
        type: "UNDO_BATCH_COPY",
        imagesToDel: imagesToDel,
        notesUUIDs: newNotesUUIDs,
        labelsUUIDs: labelsUUIDs,
      });
      window.dispatchEvent(new Event("loadingEnd"));
    };

    openSnackFunction({
      snackMessage: `${
        length === 1 ? "Note created" : length + " notes created"
      }`,
      snackOnUndo: undo,
      snackRedo: redo,
    });
  };

  const handleLabels = () => {
    setMoreMenuOpen(false);
    setLabelsOpen(true);
  };

  const menuItems = [
    {
      title: "Move to trash",
      function: handleTrashNotes,
      icon: "trash-menu-icon",
    },
    {
      title: hasLabels() ? "Change labels" : "Add label",
      function: handleLabels,
      icon: "label-menu-icon",
    },
    {
      title: "Make a copy",
      function: handleMakeCopy,
      icon: "copy-menu-icon",
    },
  ];

  useEffect(() => {
    const { batchArchiveRef, batchPinRef, batchDeleteRef } = functionRefs;
    batchArchiveRef.current = handleArchive;
    batchPinRef.current = handlePin;
    batchDeleteRef.current = handleTrashNotes;
  }, [selectedNotesIDs, handlePin, handleTrashNotes, handleArchive]);

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
            style={{ pointerEvents: selectedNotesIDs.length === 0 && "none" }}
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
              {!inTrash ? (
                <>
                  <Button
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, pinNotes ? "Unpin" : "Pin")
                    }
                    onMouseLeave={handleMouseLeave}
                    onClick={handlePin}
                    className={pinNotes ? "top-pinned-icon" : "top-pin-icon"}
                    style={{ width: "45px", height: "45px" }}
                  />
                  <Button
                    onMouseEnter={(e) => handleMouseEnter(e, "Remind me")}
                    onMouseLeave={handleMouseLeave}
                    className="top-reminder-icon"
                    style={{ width: "45px", height: "45px" }}
                  />
                  <Button
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        e,
                        archiveNotes ? "Archive" : "Unarchive"
                      )
                    }
                    onMouseLeave={handleMouseLeave}
                    onClick={handleArchive}
                    className="top-archive-icon"
                    style={{ width: "45px", height: "45px" }}
                  />
                  <Button
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, "Background options")
                    }
                    onMouseLeave={handleMouseLeave}
                    onClick={handleOpenColor}
                    className="top-color-icon"
                    style={{ width: "45px", height: "45px" }}
                  />
                  <Button
                    onMouseEnter={(e) => handleMouseEnter(e, "More")}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleOpenMenu}
                    className="top-more-icon"
                    style={{ width: "45px", height: "45px" }}
                  />
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setDeleteModalOpen(true)}
                    className="top-delete-icon"
                    style={{ width: "45px", height: "45px" }}
                  />
                  <Button
                    onClick={handleTrashNotes}
                    className="top-restore-icon"
                    style={{ width: "45px", height: "45px" }}
                  />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {moreMenuOpen && !labelsOpen && (
          <MoreMenu
            setIsOpen={setMoreMenuOpen}
            anchorEl={anchorEl}
            isOpen={moreMenuOpen}
            menuItems={menuItems}
            transformOrigin="top right"
          />
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
      <AnimatePresence>
        {labelsOpen && (
          <ManageTopLabelsMenu
            isOpen={labelsOpen}
            dispatchNotes={dispatchNotes}
            setIsOpen={setLabelsOpen}
            anchorEl={anchorEl}
            selectedNotesIDs={selectedNotesIDs}
            notes={notes}
            setFadingNotes={setFadingNotes}
            setVisibleItems={setVisibleItems}
            setSelectedNotesIDs={setSelectedNotesIDs}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteModalOpen && (
          <DeleteModal
            setIsOpen={setDeleteModalOpen}
            handleDelete={handleDeleteNotes}
            title="Delete note"
            message={
              <>
                Are you sure you want to delete this note? <br /> this action
                can't be undone.
              </>
            }
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TopMenuHome;
