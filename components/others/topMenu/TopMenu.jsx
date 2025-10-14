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
import ManageTopLabelsMenu from "../ManageTopLabelsMenu";
import { useSearch } from "@/context/SearchContext";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";

const TopMenuHome = ({
  notes,
  visibleItems,
  setVisibleItems,
  dispatchNotes,
  setFadingNotes,
  selectedNotesIDs,
  setSelectedNotesIDs,
  isDraggingRef,
  rootContainerRef,
  functionRefs,
  currentSection,
}) => {
  const {
    user,
    clientID,
    showTooltip,
    hideTooltip,
    closeToolTip,
    openSnackRef,
    setDialogInfoRef,
    fadeNote,
    notesStateRef,
  } = useAppContext();
  const { filters } = useSearch();
  const userID = user?.id;
  const [selectedNumber, setSelectedNumber] = useState(false);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
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
      return !!note?.labels.length;
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
        !e.target.closest("#modal-portal") &&
        !rootContainerRef.current?.classList.contains("dragging")
      ) {
        handleClose();
      }
    };

    document.addEventListener("click", handler);

    return () => document.removeEventListener("click", handler);
  }, [selectedNotesIDs]);

  useEffect(() => {
    requestIdleCallback(() => {
      requestAnimationFrame(() => {
        setSelectedNumber(selectedNotesIDs.length);
      });
    });
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
        const color = note?.color;
        const bg = note?.background;

        if (pinned !== false) {
          pinned = note?.isPinned ? true : false;
        }
        if (archived !== false) {
          archived = note?.isArchived ? true : false;
        }
        sharedColor.add(color);
        sharedBG.add(bg);
      });
      setPinNotes(pinned);
      setArchiveNotes(archived);
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

  const handleOpenColor = (e) => {
    closeToolTip();
    setColorAnchorEl(e.currentTarget);
    setColorMenuOpen((prev) => !prev);
  };

  const handleColorClick = async (newColor) => {
    closeToolTip();
    if (selectedColor === newColor) return;
    if (!filters.color) {
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "BATCH_UPDATE_COLOR",
        selectedNotes: selectedNotesIDs,
        color: newColor,
      });
      dispatchNotes({
        type: "BATCH_UPDATE_COLOR",
        selectedNotes: selectedNotesIDs,
        color: newColor,
      });
    }
    setSelectedColor(newColor);
    const UUIDS = selectedNotesIDs.map((data) => data.uuid);

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "color",
            value: newColor,
            noteUUIDs: UUIDS,
            clientID: clientID,
          }),
      ],
      openSnackRef.current
    );
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
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "BATCH_UPDATE_COLOR",
          selectedNotes: selectedNotes,
          color: selectedColor,
        });
        setTimeout(() => {
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
        setSelectedNotesIDs([]);
        window.dispatchEvent(new Event("topMenuClose"));
      }

      initialColorRef.current = null;
    }
  }, [colorMenuOpen]);

  const handleBackground = async (newBG) => {
    if (selectedBG === newBG) return;
    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "BATCH_UPDATE_BG",
      selectedNotes: selectedNotesIDs,
      background: newBG,
    });
    dispatchNotes({
      type: "BATCH_UPDATE_BG",
      selectedNotes: selectedNotesIDs,
      background: newBG,
    });
    setSelectedBG(newBG);
    const UUIDS = selectedNotesIDs.map((data) => data.uuid);

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "background",
            value: newBG,
            noteUUIDs: UUIDS,
            clientID: clientID,
          }),
      ],
      openSnackRef.current
    );
  };

  const handleArchive = async () => {
    closeToolTip();
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

      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "BATCH_ARCHIVE/TRASH",
        selectedNotes: selectedNotesIDs,
        property: "isArchived",
        val: archiveNotes,
      });

      setTimeout(
        () => {
          dispatchNotes({
            type: "BATCH_ARCHIVE/TRASH",
            selectedNotes: selectedNotesIDs,
            property: "isArchived",
            val: archiveNotes,
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

      handleServerCall(
        [
          () =>
            batchUpdateAction({
              type: "BATCH_ARCHIVE/TRASH",
              selectedNotes: selectedNotesIDs,
              property: "isArchived",
              val: archiveNotes,
              clientID,
            }),
        ],
        openSnackRef.current
      );
    };

    redo();

    const undo = () => {
      handleServerCall(
        [
          () =>
            undoAction({
              type: "UNDO_BATCH_ARCHIVE/TRASH",
              selectedNotes: selectedNotesIDs,
              property: "isArchived",
              val: archiveNotes,
              clientID,
            }),
        ],
        openSnackRef.current
      );

      if (fadeNote && !clearSet) {
        setVisibleItems((prev) => {
          const updated = new Set(prev);
          selectedUUIDs.forEach((uuid) => {
            updated.add(uuid);
          });
          return updated;
        });
      }

      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "UNDO_BATCH_ARCHIVE/TRASH",
        selectedNotes: selectedNotesIDs,
        property: "isArchived",
        val: archiveNotes,
        selectedUUIDs,
      });

      dispatchNotes({
        type: "UNDO_BATCH_ARCHIVE/TRASH",
        selectedNotes: selectedNotesIDs,
        property: "isArchived",
        val: archiveNotes,
        selectedUUIDs,
      });
    };

    const snackMessage =
      length === 1 ? "Note archived" : `${length} notes archived`;

    openSnackRef.current({
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
          handleServerCall(
            [
              () =>
                undoAction({
                  type: "UNDO_BATCH_PIN_ARCHIVED",
                  selectedNotes: selectedNotesIDs,
                  clientID,
                }),
            ],
            openSnackRef.current
          );

          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "UNDO_BATCH_PIN_ARCHIVED",
            selectedNotes: selectedNotesIDs,
            selectedUUIDs,
          });
          dispatchNotes({
            type: "UNDO_BATCH_PIN_ARCHIVED",
            selectedNotes: selectedNotesIDs,
            selectedUUIDs,
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

        openSnackRef.current({
          snackMessage: snackMessage,
          snackOnUndo: undo,
        });
      }

      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "BATCH_PIN",
        selectedNotes: selectedNotesIDs,
        isPinned: pinNotes,
      });

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

      handleServerCall(
        [
          () =>
            batchUpdateAction({
              type: "BATCH_PIN",
              selectedNotes: selectedNotesIDs,
              val: pinNotes,
              clientID,
            }),
        ],
        openSnackRef.current
      );
    });
  };

  const handleOpenMenu = (e) => {
    closeToolTip();
    setAnchorEl(e.currentTarget);
    setMoreMenuOpen((prev) => !prev);
    setLabelsOpen(false);
  };

  const handleTrashNotes = () => {
    const firstItem = selectedNotesIDs[0];
    const val = notes.get(firstItem.uuid).isTrash;
    const length = selectedNotesIDs.length;

    const notesWithCollabs = [];
    const selectedUUIDs = [];
    const sharedNotesSet = new Set();

    selectedNotesIDs.forEach(({ uuid }) => {
      const note = notesStateRef.current.notes.get(uuid);
      if (note?.collaborators?.length > 0) {
        if (note?.creator?._id === userID) {
          const collabIDs = note?.collaborators?.map((collab) => collab.id);
          selectedUUIDs.push(uuid);
          notesWithCollabs.push({
            uuid,
            isCreator: true,
            collabIDs: collabIDs || [],
          });
        } else {
          notesWithCollabs.push({ uuid, isCreator: false });
          sharedNotesSet.add(uuid);
        }
      }
      selectedUUIDs.push(uuid);
    });

    const execute = () => {
      const redo = async () => {
        setFadingNotes((prev) => new Set([...prev, ...selectedUUIDs]));
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "BATCH_ARCHIVE/TRASH",
          selectedNotes: selectedNotesIDs,
          property: "isTrash",
          sharedNotesSet,
          val,
        });
        requestAnimationFrame(() => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "BATCH_DELETE_NOTES",
            deletedUUIDs: [...sharedNotesSet],
          });
        });
        setTimeout(() => {
          dispatchNotes({
            type: "BATCH_ARCHIVE/TRASH",
            selectedNotes: selectedNotesIDs,
            property: "isTrash",
            sharedNotesSet,
            val,
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

        handleServerCall(
          [
            () =>
              batchUpdateAction({
                type: "BATCH_ARCHIVE/TRASH",
                selectedNotes: selectedNotesIDs,
                property: "isTrash",
                val: val,
                notesWithCollabs,
                clientID,
              }),
          ],
          openSnackRef.current
        );
      };

      redo();

      const undo = () => {
        localDbReducer({
          notes: notesStateRef.current.notes,
          order: notesStateRef.current.order,
          userID: userID,
          type: "UNDO_BATCH_ARCHIVE/TRASH",
          selectedNotes: selectedNotesIDs,
          property: "isTrash",
          val: val,
          selectedUUIDs,
        });

        dispatchNotes({
          type: "UNDO_BATCH_ARCHIVE/TRASH",
          selectedNotes: selectedNotesIDs,
          property: "isTrash",
          val: val,
          selectedUUIDs,
        });

        setVisibleItems((prev) => {
          const updated = new Set(prev);
          selectedUUIDs.forEach((uuid) => {
            updated.add(uuid);
          });
          return updated;
        });
        handleServerCall(
          [
            () =>
              undoAction({
                type: "UNDO_BATCH_ARCHIVE/TRASH",
                selectedNotes: selectedNotesIDs,
                property: "isTrash",
                val: val,
                clientID,
              }),
          ],
          openSnackRef.current
        );
      };

      const snackMessage =
        length === 1
          ? `Note ${val ? "restored" : "trashed"}`
          : `${length} notes ${val ? "restored" : "trashed"}`;

      openSnackRef.current({
        snackMessage: snackMessage,
        snackOnUndo: undo,
        snackRedo: redo,
      });

      handleClose();
    };

    if (notesWithCollabs.length > 0) {
      setMoreMenuOpen(false);
      setDialogInfoRef.current({
        func: execute,
        title: "Move to trash?",
        message:
          "Once trashed, shared notes won't be visible to anyone that the note was shared with.",
        btnMsg: "Move to trash",
      });
      return;
    }

    execute();
  };

  const handleDeleteNotes = async () => {
    let selectedUUIDs = [];

    selectedNotesIDs.forEach(({ uuid }) => {
      selectedUUIDs.push(uuid);
      const note = notes.get(uuid);
    });

    setFadingNotes(new Set(selectedUUIDs));

    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "BATCH_DELETE_NOTES",
      deletedUUIDs: selectedUUIDs,
    });
    setTimeout(() => {
      dispatchNotes({
        type: "BATCH_DELETE_NOTES",
        deletedUUIDs: selectedUUIDs,
      });
      setFadingNotes(new Set());
    }, 250);

    handleClose();

    handleServerCall(
      [() => batchDeleteNotes(selectedUUIDs, clientID)],
      openSnackRef.current
    );
  };

  const handleMakeCopy = async () => {
    const newNotes = [];
    const newNotesUUIDs = [];
    const selectedUUIDs = [];
    const newUUIDs = [];
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

      if (note?.images.length > 0) {
        note?.images.forEach((image) => {
          const newImageUUID = uuid();
          const newImage = { uuid: newImageUUID, url: image.url };
          imagesMap.set(newImageUUID, `${note?.uuid}/${image.uuid}`);
          imagesToDel.push(`${userID}/${newNoteUUID}/`);
          newImages.push(newImage);
        });
      }

      if (note?.checkboxes.length > 0) {
        const copiedCheckboxes = note?.checkboxes.map((checkbox) => {
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
        _id: newNoteUUID,
        uuid: newNoteUUID,
        title: note?.title,
        content: note?.content,
        color: note?.color,
        background: note?.background,
        labels: note?.labels,
        checkboxes: newCheckboxes,
        showCheckboxes: true,
        expandCompleted: note?.expandCompleted,
        isPinned: false,
        isArchived: false,
        isTrash: note?.isTrash,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: newImages,
      };
      selectedUUIDs.push(noteUUID);
      newNotes.push(newNote);
      newUUIDs.push(newNoteUUID);
      newNotesUUIDs.push(newNoteUUID);
    });

    setMoreMenuOpen(false);

    const redo = async () => {
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "BATCH_COPY_NOTE",
        newNotes: newNotes,
      });
      dispatchNotes({
        type: "BATCH_COPY_NOTE",
        newNotes: newNotes,
      });

      setVisibleItems((prev) => new Set([...prev, ...newNotesUUIDs]));

      const result = await handleServerCall(
        [
          () =>
            batchCopyNoteAction({
              newNotes: newNotes,
              imagesMap: imagesMap,
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "SET_NOTES",
        notes: result.newNotes,
      });
      dispatchNotes({ type: "SET_NOTES", notes: result.newNotes });
    };

    redo();

    const undo = async () => {
      setFadingNotes(new Set(newUUIDs));
      localDbReducer({
        notes: notesStateRef.current.notes,
        order: notesStateRef.current.order,
        userID: userID,
        type: "UNDO_BATCH_COPY",
        notesToDel: newUUIDs,
      });
      setTimeout(() => {
        dispatchNotes({
          type: "UNDO_BATCH_COPY",
          notesToDel: newUUIDs,
        });
        setFadingNotes(new Set());
      }, 250);
      handleServerCall(
        [
          () =>
            undoAction({
              type: "UNDO_BATCH_COPY",
              imagesToDel: imagesToDel,
              notesUUIDs: newNotesUUIDs,
              clientID: clientID,
            }),
        ],
        openSnackRef.current
      );
    };

    openSnackRef.current({
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
        {selectedNumber > 0 && (
          <motion.div
            ref={topMenuRef}
            className="top-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: selectedNumber > 0 ? 1 : 0,
              y: selectedNumber > 0 ? 0 : -20,
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              opacity: { duration: 0.18, ease: "easeIn" },
              y: { type: "spring", stiffness: 400, damping: 37, mass: 1.22 },
            }}
            style={{ pointerEvents: selectedNumber === 0 && "none" }}
          >
            <Button
              onClick={handleClose}
              onMouseEnter={(e) => showTooltip(e, "Clear selection")}
              onMouseLeave={hideTooltip}
              className="clear-icon"
              style={{
                display: "flex",
                width: "52px",
                height: "52px",
                margin: "0 0.9rem 0 0.8rem",
              }}
            />
            <span>{selectedNumber} Selected</span>
            <div className="top-menu-tools">
              {!inTrash ? (
                <>
                  <Button
                    onMouseEnter={(e) =>
                      showTooltip(e, pinNotes ? "Unpin" : "Pin")
                    }
                    onMouseLeave={hideTooltip}
                    onClick={handlePin}
                    className={pinNotes ? "top-pinned-icon" : "top-pin-icon"}
                    style={{ width: "45px", height: "45px" }}
                  />
                  <Button
                    onMouseEnter={(e) => showTooltip(e, "Remind me")}
                    onMouseLeave={hideTooltip}
                    className="top-reminder-icon"
                    style={{ width: "45px", height: "45px" }}
                  />
                  <Button
                    onMouseEnter={(e) =>
                      showTooltip(e, archiveNotes ? "Unarchive" : "Archive")
                    }
                    onMouseLeave={hideTooltip}
                    onClick={handleArchive}
                    className="top-archive-icon"
                    style={{ width: "45px", height: "45px" }}
                  />
                  <Button
                    onMouseEnter={(e) => showTooltip(e, "Background options")}
                    onMouseLeave={hideTooltip}
                    onClick={handleOpenColor}
                    className="top-color-icon"
                    style={{ width: "45px", height: "45px" }}
                  />
                  <Button
                    onMouseEnter={(e) => showTooltip(e, "More")}
                    onMouseLeave={hideTooltip}
                    onClick={handleOpenMenu}
                    className="top-more-icon"
                    style={{ width: "45px", height: "45px" }}
                  />
                </>
              ) : (
                <>
                  <Button
                    onClick={() =>
                      setDialogInfoRef.current({
                        func: handleDeleteNotes,
                        title:
                          selectedNotesIDs.length > 1
                            ? "Delete notes"
                            : "Delete note",
                        message: (
                          <>
                            {selectedNotesIDs.length > 1
                              ? `Are you sure you want to delete selected notes?`
                              : "Are you sure you want to delete this note?"}{" "}
                            <br /> this action can't be undone.
                          </>
                        ),

                        btnMsg: "Delete",
                      })
                    }
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
    </>
  );
};

export default TopMenuHome;
