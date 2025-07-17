"use client";

import { useAppContext } from "@/context/AppContext";
import { useSearch } from "@/context/SearchContext";
import { useCallback, useEffect, useRef } from "react";

export function useHashRouting({
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
}) {
  const { labelsReady, labelsRef, labelObjRef } = useAppContext();
  const { setFilters, setSearchTerm, searchTerm, skipHashChangeRef, searchRef } =
    useSearch();

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

  const handleHashChange = useCallback(() => {
    setSelectedNotesIDs([]);
    setTooltipAnchor(null);
    openSnackFunction({ close: true });
    undoFunction.current = null;
    allowUndoRef.current = true;
    allowRedoRef.current = false;

    const hash = window.location.hash.replace("#", "");
    if (hash.trim() === "") {
      setCurrentSection("Home");
    } else if (hash.startsWith("search")) {
      setCurrentSection("Search");
    }

    if (hash.toLowerCase().startsWith("note")) {
      const parts = hash.split("/");
      const noteUUID = parts[1];
      const note = notesStateRef.current.notes.get(noteUUID);
      const index = notesStateRef.current.order.findIndex(
        (uuid) => uuid === noteUUID
      );
      if (note !== undefined && !modalOpenRef.current) {
        setSelectedNote(note);
        setIsModalOpen(true);
        setModalStyle({
          index: index,
          element: null,
          initialNote: note,
        });
      }
    } else {
      if (modalOpenRef.current) {
        setIsModalOpen(false);
        skipHashChangeRef.current = true;
      }
    }

    if (skipHashChangeRef.current) {
      skipHashChangeRef.current = false;
      return;
    }

    const decodedHash = doubleDecode(hash.replace("search/", ""));
    if (hash.startsWith("search/")) {
      let dataObj = {};
      const filters = decodedHash.split("&");
      filters.forEach((filter) => {
        if (filter.startsWith("color")) {
          const color = decodeURIComponent(filter);
          let decodedColor = color.split(/=(.+)/)[1];
          dataObj.color =
            decodedColor?.charAt(0)?.toUpperCase() + decodedColor?.slice(1);
        } else if (filter.startsWith("text")) {
          const text = decodeURIComponent(filter);
          const decodedText = text.split(/=(.+)/)[1];
          dataObj.text = decodedText;
        } else if (filter.startsWith("label")) {
          if (!labelsReady) return;
          const label = decodeURIComponent(filter);
          const decodedLabel = label.split(/=(.+)/)[1];
          let labelUUID = "";
          for (const [key, object] of labelsRef.current) {
            if (object.label.toLowerCase() === decodedLabel) {
              labelUUID = key;
            }
          }
          dataObj.label = labelUUID;
        } else if (filter === "image") {
          dataObj.image = true;
        }
      });

      setFilters((prev) => ({
        ...prev,
        color: dataObj.color ?? null,
        label: dataObj.label ?? null,
        image: dataObj.image ?? null,
      }));
      const text = dataObj.text ?? "";
      setSearchTerm(text);
      requestAnimationFrame(() => {
        searchRef.current.value = text;
      });
    }
    if (hash === "search") {
      emptySearchRef.current = true;
      setFilters({
        color: null,
        label: null,
        image: null,
      });
      setSearchTerm("");
      requestAnimationFrame(() => {
        searchRef.current.value = "";
      });
    }
  }, [labelsReady]);

  useEffect(() => {
    handleHashChange();

    window.removeEventListener("hashchange", handleHashChange);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [labelsReady]);

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
          notesStateRef.current.order.forEach((order) => {
            const note = notesStateRef.current.notes.get(order);
            if (note.isTrash) return;
            colorSet.add(note.color);
            note.labels.forEach((label) => labelSet.add(label));
            note.images.length > 0 && typeSet.add("images");
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

          if (filtersNum > 2) {
            window.location.hash = "search";
            setCurrentSection(captialized(selected));
          } else if (
            colorSet.size > 1 ||
            labelSet.size > 1 ||
            typeSet.size > 1
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
