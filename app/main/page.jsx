"use client";
import NoteModal from "@/components/others/NoteModal";
import Archive from "@/components/pages/Archive";
import Labels from "@/components/pages/Labels";
import Home from "@/components/pages/Home";
import Reminders from "@/components/pages/Reminders";
import Trash from "@/components/pages/Trash";
import Snackbar from "@/components/Tools/Snackbar";
import Tooltip from "@/components/Tools/Tooltip";
import { deleteLabelAction } from "@/utils/actions";
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

const page = () => {
  const { searchTerm, filters } = useSearch();
  const {
    removeLabel,
    labelsReady,
    layout,
    currentSection,
    setCurrentSection,
    modalOpenRef,
    setLoadingImages,
    setTooltipRef,
    notesStateRef,
    openSnackRef,
    user,
    rootContainerRef,
    clientID,
  } = useAppContext();
  const [tooltipAnchor, setTooltipAnchor] = useState(null);
  const [notesState, dispatchNotes] = useReducer(notesReducer, initialStates);
  const [visibleItems, setVisibleItems] = useState(new Set());
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
        requestIdleCallback(() => {
          element.style.opacity = "0";
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
    if (!notesReady || !labelsReady || !currentSection) return;
    const order = notesStateRef.current.order;
    const notes = notesStateRef.current.notes;
    requestAnimationFrame(() => {
      if (order.length === 0 && currentSection === "Trash") {
        const btn = document.body.querySelector("#add-btn");
        if (btn) {
          btn.disabled = true;
        }
        return;
      }
      if (currentSection === "Trash") {
        const trashNotes = order.some((uuid) => notes.get(uuid).isTrash);
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
  }, [currentSection, notesReady, labelsReady]);

  const handleDeleteLabel = useCallback((data) => {
    setFadingNotes((prev) => new Set(prev).add(data.labelData.uuid));
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
      openSnackRef.current
    );
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
    data?.e?.stopPropagation();

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

  useRealtimeUpdates({ dispatchNotes });

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
    setFadingNotes,
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
    setIsGrid,
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

  const components = {
    Home,
    Labels,
    Reminders,
    Archive,
    Trash,
    Search,
    DynamicLabel,
  };

  if (!currentSection) return;

  const Page = components[currentSection];

  return (
    <>
      {/* <button
        style={{
          left: "12rem",
          top: "1rem",
          position: "fixed",
          zIndex: "1000000",
        }}
        onClick={() => {
          console.log(notesState);
        }}
      >
        ggg
      </button> */}
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

      {/* <button
        style={{
          left: "1rem",
          top: "1rem",
          position: "fixed",
          zIndex: "100000",
        }}
        onClick={()=> console.log(containerRef.current.offsetHeight)}
      >
        {" "}
        gg
      </button> */}
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
      />

      <SelectionBox ref={selectionBoxRef} />
    </>
  );
};

export default page;
