"use client";

import { useAppContext } from "@/context/AppContext";
import { useLabelsContext } from "@/context/LabelsContext";
import { useSearch } from "@/context/SearchContext";
import { openNoteAction, removeSelfAction } from "@/utils/actions";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import { useCallback, useEffect, useRef } from "react";

export function useHashRouting({
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
  dispatchNotes
}) {
  const { labelsReady, labelObjRef, openSnackRef, closeToolTip, setDialogInfoRef, user, clientID } =
    useAppContext();
  const {
    setFilters,
    setSearchTerm,
    searchTerm,
    skipHashChangeRef,
    searchRef,
  } = useSearch();

  const userID = user?.id;

  const { labelsRef } = useLabelsContext();

  const firstRun = useRef(true);
  const emptySearchRef = useRef(false);

  const tripleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(encodeURIComponent(str)));
  };

  const doubleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(str));
  };

  const doubleDecode = (str) => {
    return decodeURIComponent(decodeURIComponent(str));
  };

  const handleSearchFromHash = (hash) => {
    if (skipHashChangeRef.current) {
      skipHashChangeRef.current = false;
      return;
    }

    if (hash === "search") {
      emptySearchRef.current = true;
      setFilters((prev) =>
        Object.fromEntries(Object.keys(prev).map((key) => [key, null])),
      );
      setSearchTerm("");
      requestAnimationFrame(() => {
        if (searchRef.current) searchRef.current.value = "";
      });
      return;
    }

    if (!hash.startsWith("search/")) return;
    if (!labelsReady) return;

    const decoded = doubleDecode(hash.replace("search/", ""));
    const params = new URLSearchParams(decoded);

    const color = params.get("color");
    const text = params.get("text") ?? "";
    const image = params.has("image");
    const reminder = params.has("reminder");
    const lists = params.has("list");
    const collab = params.get("collab");

    let labelUUID = null;
    const labelName = params.get("label")?.toLowerCase();
    if (labelName) {
      for (const [key, obj] of labelsRef.current) {
        if (obj.label.toLowerCase() === labelName) {
          labelUUID = key;
          break;
        }
      }
    }

    setFilters({
      color: color ? color.charAt(0).toUpperCase() + color.slice(1) : null,
      label: labelUUID,
      collab: collab || null,
      image: image || null,
      reminder: reminder || null,
      lists: lists || null,
    });

    setSearchTerm(text);
    requestAnimationFrame(() => {
      if (searchRef.current) searchRef.current.value = text;
    });
  };

  const handleNoteFromHash = (hash) => {
    if (!hash.toLowerCase().startsWith("note")) {
      if (modalOpenRef.current) {
        setIsModalOpen(false);
        skipHashChangeRef.current = true;
      }
      return;
    }

    if (!currentSection) {
      setCurrentSection("Home");
    }

    const [, noteUUID] = hash.split("/");
    const note = notesStateRef.current.notes.get(noteUUID);
    if (!note || modalOpenRef.current) return;

    const index = notesStateRef.current.order.indexOf(noteUUID);

    const handleOpenNote = () => {
      setSelectedNote(note);
      setIsModalOpen(true);
      setModalStyle({
        index,
        element: null,
        initialNote: note,
      });
    };

    const openNote = note?.openNote ?? true;

    if (!openNote) {
      setDialogInfoRef.current({
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
          window.location.hash = ""
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
        closeFunc: ()=> window.location.hash = ""
      });
      return;
    }

    handleOpenNote();
  };

  const handleSectionFromHash = (hash) => {
    if (!hash) {
      setCurrentSection("Home");
    } else if (hash.startsWith("search")) {
      setCurrentSection("Search");
    }
  };

  const resetUIState = () => {
    setSelectedNotesIDs([]);
    setTooltipAnchor(new Map());
    openSnackRef.current({ close: true });
    undoFunction.current = null;
    allowUndoRef.current = true;
    allowRedoRef.current = false;
  };

  const handleHashChange = useCallback(() => {
    closeToolTip();
    const hash = window.location.hash.replace("#", "");
    handleSectionFromHash(hash);
    handleNoteFromHash(hash);
    if (!currentSection) return;
    resetUIState();

    handleSearchFromHash(hash);
  }, [labelsReady, currentSection]);

  useEffect(() => {
    handleHashChange();

    window.removeEventListener("hashchange", handleHashChange);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [labelsReady, currentSection]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (emptySearchRef.current && !searchTerm.trim()) {
      emptySearchRef.current = false;
      return;
    } else {
      emptySearchRef.current = false;
    }

    const hash = window.location.hash.replace("#", "");
    let encodedNewHash = "";
    let filteredRest = [];
    if (hash.startsWith("search/")) {
      const decodedHash = doubleDecode(hash.replace("search/", ""));
      const filters = decodedHash.split("&");

      filters.forEach((filter) => {
        if (filter.startsWith("text")) {
          return;
        }
        filteredRest.push(decodeURIComponent(filter));
      });

      if (!searchTerm.trim()) {
        if (filteredRest.length === 0) {
          encodedNewHash = "search";
        } else {
          //searchTerm  not-encoded
          //filteredRest not-encoded
          const and = doubleEncode("&");
          const eq = doubleEncode("=");
          const encodedFilters = filteredRest.map((filter) => {
            const parts = filter.split(/=(.+)/);

            let updatedFilter = "";

            if (parts[0] === "image") {
              updatedFilter = parts[0];
            } else {
              updatedFilter = parts[0] + eq + tripleEncode(parts[1]);
            }

            return updatedFilter;
          });

          const joinedFilters = encodedFilters.join(and);
          encodedNewHash = "search/" + joinedFilters;
        }
      } else {
        const encodedTerm = tripleEncode(searchTerm.toLowerCase().trim());

        if (filteredRest.length === 0) {
          encodedNewHash = "search/" + doubleEncode("text=") + encodedTerm;
        } else {
          const and = doubleEncode("&");
          const eq = doubleEncode("=");

          const encodedFilters = filteredRest.map((filter) => {
            const parts = filter.split(/=(.+)/);

            let updatedFilter = "";

            if (parts[0] === "image") {
              updatedFilter = parts[0];
            } else {
              updatedFilter = parts[0] + eq + tripleEncode(parts[1]);
            }

            return updatedFilter;
          });

          const joinedFilters = encodedFilters.join(and);
          encodedNewHash =
            "search/" +
            doubleEncode("text=") +
            encodedTerm +
            and +
            joinedFilters;
        }
      }
    } else {
      const encodedTerm = tripleEncode(searchTerm.toLowerCase().trim());

      encodedNewHash = "search/" + doubleEncode("text=") + encodedTerm;
    }
    if (!searchTerm.trim() && currentSection.toLowerCase() !== "search") {
      return;
    }
    window.location.hash = encodedNewHash;
  }, [searchTerm]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.detail?.hash) return;
      requestAnimationFrame(() => {
        const selected = e.detail.hash;
        const captialized = (hash) =>
          hash.charAt(0).toUpperCase() + hash.slice(1);

        if (selected === "search") {
          const colorSet = new Set();
          const labelSet = new Set();
          const typeSet = new Set();
          const peopleSet = new Set();
          notesStateRef.current.order.forEach((order) => {
            const note = notesStateRef.current.notes.get(order);
            if (note?.isTrash) return;
            colorSet.add(note?.color);
            note?.labels.forEach((label) => labelSet.add(label));
            note?.images.length > 0 && typeSet.add("images");
            note?.reminder && typeSet.add("reminders");
            note?.checkboxes.length > 0 && typeSet.add("lists");
            note?.collaborators.forEach((collab) => {
              const username =
                collab?.data?.username || collab?.snapshot?.username;
              peopleSet.add(username);
            });
          });
          let filtersNum = 0;

          if (colorSet.size > 0) {
            ++filtersNum;
          }

          if (labelSet.size > 0) {
            ++filtersNum;
          }

          if (typeSet.size > 0) {
            ++filtersNum;
          }

          if (peopleSet.size > 0) {
            ++filtersNum;
          }

          if (filtersNum > 2) {
            window.location.hash = "search";
            setCurrentSection(captialized(selected));
          } else if (
            colorSet.size > 1 ||
            labelSet.size > 1 ||
            typeSet.size > 1 ||
            peopleSet.size > 1
          ) {
            window.location.hash = "search";
            setCurrentSection(captialized(selected));
          }
        } else if (selected.startsWith("label/")) {
          setCurrentSection("DynamicLabel");
        } else {
          setCurrentSection(captialized(selected));
        }
      });
    };

    window.addEventListener("sectionChange", handler);
    return () => window.removeEventListener("sectionChange", handler);
  }, [selectedNote]);

  useEffect(() => {
    const handler = () => {
      if (skipSetLabelObjRef.current) {
        skipSetLabelObjRef.current = false;
        return;
      }
      if (currentSection?.toLowerCase() !== "dynamiclabel") {
        setLabelObj(null);
        labelObjRef.current = null;
        return;
      }
      const hash = window.location.hash.replace("#label/", "");
      const decodedHash = decodeURIComponent(hash);
      let targetedLabel = null;
      labelsRef.current.forEach((labelData) => {
        if (labelData.label.toLowerCase() === decodedHash.toLowerCase()) {
          targetedLabel = labelData;
        }
      });

      if (targetedLabel) {
        setLabelObj(targetedLabel);
        labelObjRef.current = targetedLabel;
      }
    };

    handler();

    window.addEventListener("hashchange", handler);

    return () => window.removeEventListener("hashchange", handler);
  }, [currentSection, labelsReady]);
}
