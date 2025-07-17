"use client";
import NoteModal from "@/components/others/NoteModal";
import Archive from "@/components/pages/Archive";
import Labels from "@/components/pages/Labels";
import Home from "@/components/pages/Home";
import Reminders from "@/components/pages/Reminders";
import Trash from "@/components/pages/Trash";
import Snackbar from "@/components/Tools/Snackbar";
import Tooltip from "@/components/Tools/Tooltip";
import { deleteLabelAction, fetchNotes } from "@/utils/actions";
import React, {
  createRef,
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

const page = () => {
  const { searchTerm, searchRef, filters } = useSearch();
  const {
    removeLabel,
    labelsReady,
    ignoreKeysRef,
    layout,
    currentSection,
    setCurrentSection,
    modalOpenRef,
    setLoadingImages,
    openSnackRef,
    setTooltipRef,
  } = useAppContext();
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [notesState, dispatchNotes] = useReducer(notesReducer, initialStates);
  const [visibleItems, setVisibleItems] = useState(new Set());
  const notesStateRef = useRef(notesState);
  const [modalStyle, setModalStyle] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notesReady, setNotesReady] = useState(false);
  const [selectedNotesIDs, setSelectedNotesIDs] = useState([]);
  const [fadingNotes, setFadingNotes] = useState(new Set());
  const [snackbarState, setSnackbarState] = useState({
    snackOpen: false,
    showUndo: true,
    message: "",
  });
  const [unloadWarn, setUnloadWarn] = useState(false);
  const [noActionUndone, setNoActionUndone] = useState(false);
  const [labelObj, setLabelObj] = useState(null);
  const [isGrid, setIsGrid] = useState(layout === "grid");
  const undoFunction = useRef(null);
  const redoFunction = useRef(null);
  const allowUndoRef = useRef(true);
  const allowRedoRef = useRef(null);
  const onCloseFunction = useRef(() => {});
  const closeRef = useRef(null);
  const keyThrottleRef = useRef(false);
  const areNotesSelectedRef = useRef(false);
  const ctrlDownRef = useRef(false);
  const batchArchiveRef = useRef(() => {});
  const batchPinRef = useRef(() => {});
  const batchDeleteRef = useRef(() => {});
  const isDraggingRef = useRef(false);
  const selectionBoxRef = useRef(null);
  const selectedNotesRef = useRef(new Set());
  const rootContainerRef = useRef(null);
  const skipSetLabelObjRef = useRef(false);
  const containerRef = useRef(null);

  const fadeNote =
    currentSection !== "DynamicLabel" && currentSection !== "Search";

  const openSnackFunction = useCallback((data) => {
    const showUndo = data.showUndo ?? true;
    const noAction = data.noActionUndone ?? false;
    if (data.close) {
      setSnackbarState((prev) => ({
        ...prev,
        snackOpen: false,
      }));
      onCloseFunction.current();
    } else {
      setSnackbarState((prev) => ({
        ...prev,
        snackOpen: false,
      }));
      onCloseFunction.current();

      setTimeout(() => {
        setSnackbarState({
          message: data.snackMessage,
          showUndo: showUndo,
          snackOpen: true,
        });
        if (data.snackOnUndo !== undefined) {
          allowUndoRef.current = true;
          allowRedoRef.current = false;
          undoFunction.current = data.snackOnUndo;
        }
        if (data.snackRedo !== undefined) {
          redoFunction.current = data.snackRedo;
        }
        if (data.snackOnClose !== undefined) {
          onCloseFunction.current = data.snackOnClose;
        }
        if (data.unloadWarn) {
          setUnloadWarn(true);
        }

        setNoActionUndone(noAction);
      }, 80);
    }
  }, []);

  useEffect(() => {
    openSnackRef.current = openSnackFunction;
    setTooltipRef.current = setTooltipAnchor;
  }, []);

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

  const getNotes = async () => {
    requestAnimationFrame(async () => {
      window.dispatchEvent(new Event("loadingStart"));
      window.dispatchEvent(new Event("loadLabels"));
      const fetchedNotes = await fetchNotes();
      window.dispatchEvent(new Event("loadingEnd"));

      const notesMap = new Map(
        fetchedNotes.data.map((note) => [
          note.uuid,
          { ...note, ref: createRef() },
        ])
      );
      dispatchNotes({
        type: "SET_INITIAL_DATA",
        notes: notesMap,
        order: fetchedNotes.order,
      });
      setNotesReady(true);
    });
  };

  useEffect(() => {
    getNotes();
    window.addEventListener("refresh", getNotes);

    return () => window.removeEventListener("refresh", getNotes);
  }, []);

  const handleNoteClick = useCallback((e, note, index) => {
    if (
      e.target.closest("button") ||
      !e.currentTarget.classList.contains("grid-item")
    ) {
      return;
    }
    const element = e.currentTarget;

    requestAnimationFrame(() => {
      setModalStyle({
        index: index,
        element: element,
        initialNote: note,
      });

      rootContainerRef.current.classList.add("modal-open");
      requestAnimationFrame(() => {
        element.style.opacity = "0";
        requestIdleCallback(() => {
          setSelectedNote(note);
          setIsModalOpen(true);
        });
      });
    });
  }, []);

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
        (uuid) => uuid === noteUUID
      );
      if (note !== undefined) {
        setSelectedNote(note);
        setIsModalOpen(true);
        setModalStyle({
          index: index,
          element: null,
          initialNote: note,
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
    if (!currentSection || !notesReady || !labelsReady) return;
    notesStateRef.current = notesState;
    requestAnimationFrame(() => {
      if (notesState.order.length === 0 && currentSection === "Trash") {
        const btn = document.body.querySelector("#add-btn");
        if (btn) {
          btn.disabled = true;
        }
        return;
      }
      if (currentSection === "Trash") {
        const trashNotes = notesState.order.some(
          (uuid) => notesState.notes.get(uuid).isTrash
        );
        if (!trashNotes) {
          const btn = document.body.querySelector("#add-btn");
          btn.disabled = true;
        } else {
          const btn = document.body.querySelector("#add-btn");
          btn.disabled = false;
        }
      } else {
        const btn = document.body.querySelector("#add-btn");
        btn.disabled = false;
      }
    });
  }, [
    currentSection,
    notesState.order,
    notesState.notes,
    notesReady,
    labelsReady,
  ]);

  const handleDeleteLabel = useCallback((data) => {
    setFadingNotes((prev) => new Set(prev).add(data.labelData.uuid));

    setTimeout(async () => {
      dispatchNotes({
        type: "REMOVE_LABEL_FROM_NOTES",
        labelUUID: data.labelData.uuid,
      });
      setVisibleItems((prev) => {
        const updated = new Set(prev);
        updated.delete(data.labelData.uuid);
        return updated;
      });
      removeLabel(data.labelData.uuid, data.labelData.label);
      data.triggerReRender((prev) => !prev);
      window.dispatchEvent(new Event("refreshPinnedLabels"));
      window.dispatchEvent(new Event("loadingStart"));
      await deleteLabelAction({
        labelUUID: data.labelData.uuid,
        hasImage: data.labelData.image,
      });
      window.dispatchEvent(new Event("loadingEnd"));
    }, 250);
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
    data.e.stopPropagation();

    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
    data.setSelected((prev) => !prev);

    if (data.selected) {
      data.setSelected(false);
      setSelectedNotesIDs((prev) =>
        prev.filter((noteData) => noteData.uuid !== data.uuid)
      );
      selectedNotesRef.current.delete(data.uuid);
    } else {
      data.setSelected(true);
      setSelectedNotesIDs((prev) => [
        ...prev,
        { uuid: data.uuid, index: data.index, isPinned: data.isPinned },
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
    if (note.isTrash) return false;

    if (filters.color && note.color !== filters.color) {
      return false;
    }

    if (
      searchTerm &&
      !(
        note.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    ) {
      return false;
    }

    if (filters.label && !note.labels.includes(filters.label)) {
      return false;
    }

    if (filters.image && note.images.length === 0) {
      return false;
    }
    return true;
  };

  useHashRouting({
    setCurrentSection,
    setSelectedNotesIDs,
    setTooltipAnchor,
    openSnackFunction,
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
    setFadingNotes,
    openSnackFunction,
    setLoadingImages,
    labelObj,
    currentSection,
    fadeNote,
  });

  useKeyBindings({
    selectedNotesRef,
    setSelectedNotesIDs,
    notesStateRef,
    searchRef,
    layout,
    currentSection,
    ignoreKeysRef,
    ctrlDownRef,
    keyThrottleRef,
    undoFunction,
    allowUndoRef,
    allowRedoRef,
    redoFunction,
    setSnackbarState,
    matchesFilters,
    setIsModalOpen,
  });

  useMouseSelection({
    notesStateRef,
    selectedNotesRef,
    selectionBoxRef,
    ctrlDownRef,
    isDraggingRef,
    rootContainerRef,
  });

  useBatchLoading({
    currentSection,
    notesState,
    notesStateRef,
    setVisibleItems,
    visibleItems,
    labelObj,
    notesReady,
    setIsGrid,
    containerRef,
    matchesFilters,
  });

  const components = {
    Home,
    Labels,
    Reminders,
    Archive,
    Trash,
    Search,
    DynamicLabel,
  };

  const Page = components[currentSection];

  return (
    <>
      <div
        id="n-overlay"
        onClick={() => {
          setIsModalOpen(false);
        }}
        className="note-overlay"
      />

      <NoteModal
        localNote={selectedNote}
        setLocalNote={setSelectedNote}
        setVisibleItems={setVisibleItems}
        filters={filters}
        setFadingNotes={setFadingNotes}
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
      {tooltipAnchor?.display && <Tooltip anchorEl={tooltipAnchor} />}
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
      <div className="starting-div-header" />

      <TopMenu
        fadeNote={fadeNote}
        notes={notesState.notes}
        visibleItems={visibleItems}
        setVisibleItems={setVisibleItems}
        functionRefs={{ batchArchiveRef, batchPinRef, batchDeleteRef }}
        dispatchNotes={dispatchNotes}
        setFadingNotes={setFadingNotes}
        selectedNotesIDs={selectedNotesIDs}
        setSelectedNotesIDs={setSelectedNotesIDs}
        isDraggingRef={isDraggingRef}
        rootContainerRef={rootContainerRef}
        currentSection={currentSection}
      />

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
        handleDeleteLabel={handleDeleteLabel}
        selectedNotesIDs={selectedNotesIDs}
        fadingNotes={fadingNotes}
        setFadingNotes={setFadingNotes}
        setSelectedNotesIDs={setSelectedNotesIDs}
        noteActions={noteActions}
        notesReady={notesReady}
        isGrid={isGrid}
        containerRef={containerRef}
        rootContainerRef={rootContainerRef}
        labelObj={labelObj}
        setLabelObj={setLabelObj}
      />

      <SelectionBox ref={selectionBoxRef} />
    </>
  );
};

export default page;
