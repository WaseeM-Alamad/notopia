"use client";
import NoteModal from "@/components/others/NoteModal";
import Archive from "@/components/pages/Archive";
import Labels from "@/components/pages/Labels";
import Home from "@/components/pages/Home";
import Reminders from "@/components/pages/Reminders";
import Trash from "@/components/pages/Trash";
import Snackbar from "@/components/Tools/Snackbar";
import Tooltip from "@/components/Tools/Tooltip";
import {
  deleteLabelAction,
  openNoteAction,
  removeSelfAction,
} from "@/utils/actions";
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useAppContext } from "@/context/AppContext";
import TopMenu from "@/components/others/topMenu/TopMenu";
import SelectionBox from "@/components/others/SelectionBox";
import Search from "@/components/pages/Search";
import { useSearch } from "@/context/SearchContext";
import DynamicLabel from "@/components/pages/DynamicLabel";
import { initialStates, notesReducer } from "@/utils/notesReducer";
import { useNoteActions } from "@/hooks/useNoteActions";
import { useKeyBindings } from "@/hooks/useKeyBindings";
import { useMouseSelection } from "@/hooks/useMouseSelection";
import { useBatchLoading } from "@/hooks/useBatchLoading";
import { useHashRouting } from "@/hooks/useHashRouting";
import { useDataManager } from "@/hooks/useDataManager";
import { useSnackbar } from "@/hooks/useSnackbar";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { AnimatePresence, motion } from "framer-motion";
import ActionModal from "@/components/others/ActionModal";
import CustomThreeLineSpinner from "@/components/Tools/CustomSpinner";
import SplashScreen from "@/components/others/SplashScreen";
import { useLabelsContext } from "@/context/LabelsContext";
import { MasonryProvider } from "@/context/MasonryContext";
import { useLayout } from "@/context/LayoutContext";

const page = () => {
  const { searchTerm, filters } = useSearch();
  const {
    currentSection,
    setCurrentSection,
    modalOpenRef,
    setLoadingImages,
    setTooltipRef,
    setDialogInfoRef,
    notesStateRef,
    openSnackRef,
    addButtonRef,
    user,
    rootContainerRef,
    clientID,
    initialLoading,
  } = useAppContext();
  const { removeLabel } = useLabelsContext();
  const { calculateLayoutRef, layout } = useLayout();
  const [tooltipAnchor, setTooltipAnchor] = useState(new Map());
  const [notesState, dispatchNotes] = useReducer(notesReducer, initialStates);
  const [visibleItems, setVisibleItems] = useState(new Set());
  const [modalStyle, setModalStyle] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notesReady, setNotesReady] = useState(false);
  const [selectedNotesIDs, setSelectedNotesIDs] = useState([]);
  const [snackbarState, setSnackbarState] = useState({
    snackOpen: false,
    showUndo: true,
    message: "",
  });
  const [unloadWarn, setUnloadWarn] = useState(false);
  const [noActionUndone, setNoActionUndone] = useState(false);
  const [labelObj, setLabelObj] = useState(null);
  const [dialogInfo, setDialogInfo] = useState(null);

  const undoFunction = useRef(null);
  const redoFunction = useRef(null);
  const allowUndoRef = useRef(true);
  const allowRedoRef = useRef(null);
  const onCloseFunction = useRef(() => {});
  const closeRef = useRef(null);
  const areNotesSelectedRef = useRef(false);
  const ctrlDownRef = useRef(false);
  const batchArchiveRef = useRef(() => {});
  const batchPinRef = useRef(() => {});
  const batchDeleteRef = useRef(() => {});
  const isDraggingRef = useRef(false);
  const selectionBoxRef = useRef(null);
  const selectedNotesRef = useRef(new Set());
  const skipSetLabelObjRef = useRef(false);
  const containerRef = useRef(null);
  const userID = user?.id;

  useEffect(() => {
    setTooltipRef.current = setTooltipAnchor;
    notesStateRef.current = notesState;
    setDialogInfoRef.current = setDialogInfo;
  }, []);

  const tRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.display = "none";
    tRef.current = setTimeout(() => {
      container.style.removeProperty("display");
    }, 200);

    return () => clearTimeout(tRef.current);
  }, [layout]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (unloadWarn) {
        const message =
          "Your request is still in progress. Are you sure you want to leave?";
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unloadWarn]);

  const handleNoteClick = useCallback((e, note, index, collab = false) => {
    const element = e.currentTarget;

    const handleOpenNote = () => {
      requestAnimationFrame(() => {
        setModalStyle({
          index: index,
          element: element,
          initialNote: note,
          collab: collab,
        });

        rootContainerRef.current.classList.add("modal-open");
        requestAnimationFrame(() => {
          requestIdleCallback(() => {
            element.style.opacity = "0";
            setSelectedNote(note);
            setIsModalOpen(true);
          });
        });
      });
    };

    const openNote = note?.openNote ?? true;

    if (!openNote) {
      setDialogInfo({
        func: () => {
          dispatchNotes({
            type: "OPEN_NOTE",
            noteUUID: note?.uuid,
          });
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "OPEN_NOTE",
            noteUUID: note?.uuid,
          });
          handleServerCall(
            [() => openNoteAction(note?.uuid, clientID)],
            openSnackRef.current,
          );
          handleOpenNote();
        },
        title: "This note has been shared with you",
        message: (
          <span>
            The owner of this note is
            <span style={{ fontWeight: "bold" }}>
              {" " + note?.creator?.username || "Owner"}
            </span>
            . You should only open notes from someone you trust. How would you
            like to proceed?
          </span>
        ),
        btnMsg: "Open note",
        cancelFunc: () => {
          localDbReducer({
            notes: notesStateRef.current.notes,
            order: notesStateRef.current.order,
            userID: userID,
            type: "DELETE_NOTE",
            note: note,
          });
          dispatchNotes({
            type: "DELETE_NOTE",
            note: note,
          });
          handleServerCall(
            [() => removeSelfAction(note?.uuid, clientID)],
            openSnackRef.current,
          );
        },
        cancelBtnMsg: "Delete note",
        showCloseBtn: true,
      });
      return;
    }

    handleOpenNote();
  }, []);

  useEffect(() => {
    if (!isModalOpen || !updateModalRef.current) return;
    const notes = notesState.notes;
    if (notes.get(modalStyle?.initialNote?.uuid) === undefined) {
      const creatorID = modalStyle?.initialNote?.creator?._id;
      const message = creatorID === userID ? "Note deleted" : "Note unshared";
      openSnackRef.current({
        snackMessage: message,
        showUndo: false,
      });
      setIsModalOpen(false);
      return;
    }
    setModalStyle((prev) => {
      const note = prev?.initialNote;
      if (!note) return prev;
      const updatedNote = notes.get(note?.uuid);
      setSelectedNote(updatedNote);
      return { ...prev, initialNote: updatedNote };
    });
    updateModalRef.current = false;
  }, [notesState.notes]);

  useEffect(() => {
    modalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  useEffect(() => {
    if (!notesReady) return;
    const hash = window.location.hash.replace("#", "");
    if (hash.toLowerCase().startsWith("note")) {
      const noteUUID = hash.slice(5);
      const note = notesState.notes.get(noteUUID);
      const index = notesStateRef.current.order.findIndex(
        (uuid) => uuid === noteUUID,
      );
      if (note !== undefined) {
        setSelectedNote(note);
        setIsModalOpen(true);
        setModalStyle({
          index: index,
          element: null,
          initialNote: note,
        });
      } else {
        setDialogInfo({
          func: () => window.location.replace("#home"),
          title: "Note not found",
          message:
            "This note may have been deleted or you may not have permission to view it.",
          btnMsg: "Okay",
          cancelFunc: () => window.location.replace("#home"),
          closeFunc: () => window.location.replace("#home"),
        });
      }
    }
  }, [notesReady]);

  useEffect(() => {
    if (searchTerm.trim() !== "" && currentSection !== "Search") {
      setCurrentSection("Search");
    }
  }, [searchTerm]);

  useEffect(() => {
    if (!currentSection) return;
    const order = notesState.order;
    const notes = notesState.notes;
    const btn = addButtonRef?.current;
    requestAnimationFrame(() => {
      if (order.length === 0 && currentSection === "Trash") {
        if (btn) {
          btn.disabled = true;
        }
        return;
      }

      if (currentSection === "Trash") {
        const trashNotes = order.some((uuid) => notes.get(uuid)?.isTrash);
        if (!btn) return;
        if (!trashNotes) {
          btn.disabled = true;
        } else {
          btn.disabled = false;
        }
      } else {
        if (!btn) return;
        btn.disabled = false;
      }
    });
  }, [currentSection, notesState]);

  const handleDeleteLabel = useCallback((data) => {
    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "REMOVE_LABEL_FROM_NOTES",
      labelUUID: data.labelData.uuid,
    });
    handleServerCall(
      [
        () =>
          deleteLabelAction({
            labelUUID: data.labelData.uuid,
            hasImage: data.labelData.image,
            clientID: clientID,
          }),
      ],
      openSnackRef.current,
    );
    dispatchNotes({
      type: "REMOVE_LABEL_FROM_NOTES",
      labelUUID: data.labelData.uuid,
    });
    removeLabel(data.labelData.uuid, data.labelData.label);
    data.triggerReRender((prev) => !prev);
    window.dispatchEvent(new Event("refreshPinnedLabels"));
  }, []);

  const handleSelectNote = useCallback((data) => {
    if (data.source === "note" && !areNotesSelectedRef.current) {
      return;
    }
    if (data.clear) {
      setSelectedNotesIDs([]);
      window.dispatchEvent(new Event("topMenuClose"));
      return;
    }
    data?.e?.stopPropagation();

    setTooltipAnchor(new Map());
    data.setSelected((prev) => !prev);

    if (data.selected) {
      data.setSelected(false);
      setSelectedNotesIDs((prev) =>
        prev.filter((noteData) => noteData.uuid !== data.uuid),
      );
      selectedNotesRef.current.delete(data.uuid);
    } else {
      data.setSelected(true);
      setSelectedNotesIDs((prev) => [
        ...prev,
        {
          uuid: data.uuid,
          index: data.index,
          isPinned: data.isPinned,
          isArchived: data.isArchived,
        },
      ]);

      selectedNotesRef.current.add(data.uuid);
    }
  }, []);

  useEffect(() => {
    const length = selectedNotesIDs.length;

    if (length === 0) {
      areNotesSelectedRef.current = false;
      selectedNotesRef.current = new Set();
    } else {
      areNotesSelectedRef.current = true;
    }
  }, [selectedNotesIDs.length]);

  const matchesFilters = (note) => {
    if (note?.isTrash) return false;

    if (filters.color && note?.color !== filters.color) {
      return false;
    }

    if (
      searchTerm &&
      !(
        note?.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        note?.content.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    ) {
      return false;
    }

    if (filters.label && !note?.labels.includes(filters.label)) {
      return false;
    }

    if (filters.lists && note?.checkboxes.length === 0) {
      return false;
    }

    if (filters.image && note?.images.length === 0) {
      return false;
    }

    if (filters.collab) {
      const selected = filters.collab.toLowerCase();

      const creatorUsername = note?.creator?.username?.toLowerCase();
      const isOtherCreator =
        creatorUsername === selected && note?.creator?._id !== userID;

      const hasMatchingCollab = note?.collaborators?.some((collab) => {
        const username = collab?.data?.username || collab?.snapshot?.username;

        return username?.toLowerCase() === selected;
      });

      if (!hasMatchingCollab && !isOtherCreator) {
        return false;
      }
    }

    return true;
  };

  const updateModalRef = useRef(false);
  useRealtimeUpdates({ dispatchNotes, updateModalRef, setVisibleItems });

  useDataManager({ notesState, dispatchNotes, notesReady, setNotesReady });

  useHashRouting({
    setCurrentSection,
    setSelectedNotesIDs,
    setTooltipAnchor,
    undoFunction,
    allowUndoRef,
    allowRedoRef,
    notesStateRef,
    modalOpenRef,
    setSelectedNote,
    setIsModalOpen,
    setModalStyle,
    setLabelObj,
    currentSection,
    selectedNote,
    skipSetLabelObjRef,
  });

  const { noteActions } = useNoteActions({
    dispatchNotes,
    setVisibleItems,
    setLoadingImages,
    labelObj,
    currentSection,
  });

  useKeyBindings({
    selectedNotesRef,
    setSelectedNotesIDs,
    notesState,
    notesStateRef,
    ctrlDownRef,
    undoFunction,
    allowUndoRef,
    allowRedoRef,
    redoFunction,
    batchArchiveRef,
    batchPinRef,
    noteActions,
    batchDeleteRef,
    setSnackbarState,
    matchesFilters,
    setIsModalOpen,
    dispatchNotes,
  });

  useMouseSelection({
    notesStateRef,
    visibleItems,
    selectedNotesRef,
    selectionBoxRef,
    ctrlDownRef,
    isDraggingRef,
    rootContainerRef,
  });

  useBatchLoading({
    notesState,
    notesStateRef,
    setVisibleItems,
    visibleItems,
    labelObj,
    notesReady,
    containerRef,
    matchesFilters,
  });

  useSnackbar({
    setSnackbarState,
    setNoActionUndone,
    setUnloadWarn,
    undoFunction,
    redoFunction,
    onCloseFunction,
    allowUndoRef,
    allowRedoRef,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      const notes = notesStateRef.current.notes;
      const order = notesStateRef.current.order;

      setVisibleItems((prev) => {
        const next = new Set(prev);
        let changed = false;

        order.forEach((uuid) => {
          const note = notes.get(uuid);
          const isMounted = note?.ref?.current;
          const isVisible = next.has(uuid);

          if (isVisible && !isMounted) {
            next.delete(uuid);
            changed = true;
          }
        });

        if (changed) {
          calculateLayoutRef.current();
          return next;
        }

        return prev;
      });
    }, 240);

    return () => clearTimeout(t);
  }, [notesState.notes]);

  const components = {
    Home,
    Labels,
    Reminders,
    Archive,
    Trash,
    Search,
    DynamicLabel,
  };

  if (!currentSection) {
    return null;
  }

  const Page = components[currentSection];

  return (
    <>
      <SplashScreen />
      <div
        style={{
          pointerEvents: initialLoading && "none",
          opacity: initialLoading ? "0" : "1",
          transition: "opacity 0.2s ease",
        }}
      >
        <div
          id="n-overlay"
          onClick={() => {
            setIsModalOpen(false);
          }}
          className="note-modal-overlay"
        />

        <NoteModal
          localNote={selectedNote}
          setLocalNote={setSelectedNote}
          setVisibleItems={setVisibleItems}
          noteActions={noteActions}
          dispatchNotes={dispatchNotes}
          initialStyle={modalStyle}
          setInitialStyle={setModalStyle}
          onClose={() => setSelectedNote(null)}
          closeRef={closeRef}
          currentSection={currentSection}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          rootContainerRef={rootContainerRef}
          setModalStyle={setModalStyle}
          labelObj={labelObj}
          skipSetLabelObjRef={skipSetLabelObjRef}
        />
        <AnimatePresence>
          {[...tooltipAnchor].map(([anchor, text], index) => (
            <Tooltip key={text} anchorEl={anchor} text={text} />
          ))}
        </AnimatePresence>
        <Snackbar
          snackbarState={snackbarState}
          setSnackbarState={setSnackbarState}
          undo={undoFunction}
          unloadWarn={unloadWarn}
          setUnloadWarn={setUnloadWarn}
          noActionUndone={noActionUndone}
          setNoActionUndone={setNoActionUndone}
          onClose={onCloseFunction}
        />
        <TopMenu
          notes={notesState.notes}
          visibleItems={visibleItems}
          setVisibleItems={setVisibleItems}
          functionRefs={{ batchArchiveRef, batchPinRef, batchDeleteRef }}
          dispatchNotes={dispatchNotes}
          selectedNotesIDs={selectedNotesIDs}
          setSelectedNotesIDs={setSelectedNotesIDs}
          isDraggingRef={isDraggingRef}
          rootContainerRef={rootContainerRef}
          currentSection={currentSection}
        />
        <div style={{ display: "flex" }}>
          <div className="sidebar-ghost" />
          <MasonryProvider
            visibleItems={visibleItems}
            notes={notesState.notes}
            order={notesState.order}
            labelObj={labelObj}
            containerRef={containerRef}
          >
            {/* <button style={{zIndex: "10000", position: "fixed"}} onClick={()=> console.log(visibleItems)}>check</button> */}
            <Page
              dispatchNotes={dispatchNotes}
              visibleItems={visibleItems}
              setVisibleItems={setVisibleItems}
              selectedNotesRef={selectedNotesRef}
              notes={notesState.notes}
              notesStateRef={notesStateRef}
              order={notesState.order}
              handleNoteClick={handleNoteClick}
              handleSelectNote={handleSelectNote}
              selectedNotesIDs={selectedNotesIDs}
              setSelectedNotesIDs={setSelectedNotesIDs}
              noteActions={noteActions}
              notesReady={notesReady}
              containerRef={containerRef}
              rootContainerRef={rootContainerRef}
              labelObj={labelObj}
              handleDeleteLabel={handleDeleteLabel}
            />
          </MasonryProvider>
        </div>

        <SelectionBox ref={selectionBoxRef} />
        <AnimatePresence>
          {dialogInfo && (
            <ActionModal
              setDialogInfo={setDialogInfo}
              dialogInfo={dialogInfo}
              func={dialogInfo?.func || (() => {})}
              cancelFunc={dialogInfo?.cancelFunc || (() => {})}
              closeFunc={dialogInfo?.closeFunc || (() => {})}
              title={dialogInfo?.title || ""}
              message={dialogInfo?.message || ""}
              btnMsg={dialogInfo?.btnMsg || "okay"}
              cancelBtnMsg={dialogInfo?.cancelBtnMsg || "Cancel"}
              showCloseBtn={dialogInfo?.showCloseBtn || false}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default page;
