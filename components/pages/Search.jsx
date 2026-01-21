import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import FilteredNotes from "../others/FilteredNotes";
import { useSearch } from "@/context/SearchContext";
import { useAppContext } from "@/context/AppContext";
import { useLabelsContext } from "@/context/LabelsContext";

const Search = ({
  notesStateRef,
  notes,
  selectedNotesRef,
  order,
  dispatchNotes,
  setSelectedNotesIDs,
  handleNoteClick,
  handleSelectNote,
  fadingNotes,
  setFadingNotes,
  rootContainerRef,
  noteActions,
  notesReady,
  containerRef,
  visibleItems,
  setVisibleItems,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    searchRef,
    filters,
    setFilters,
    skipHashChangeRef,
  } = useSearch();
  const {
    setIsFiltered,
    showTooltip,
    hideTooltip,
    focusedIndex,
  } = useAppContext();
  const { labelsRef } = useLabelsContext();
  const [colorsSet, setColorsSet] = useState(new Set());
  const [labelsSet, setLabelsSet] = useState(new Set());
  const [typesSet, setTypesSet] = useState(new Set());

  const firstRun = useRef(true);

  let renderedIndex = -1;

  const filtersExist =
    Object.values(filters).some((filter) => filter !== null) ||
    searchTerm.trim();

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

    if (filters.image && note?.images.length === 0) {
      return false;
    }

    return true;
  };

  const filteredNotes = new Set(
    order.filter((uuid, index) => {
      const note = notes.get(uuid);
      if (note && matchesFilters(note) && filtersExist) {
        if (!focusedIndex.current) {
          focusedIndex.current = index;
        }
        return true;
      }
      return false;
    }),
  );

  const noMatchingNotes = filteredNotes.size === 0;

  useEffect(() => {
    setIsFiltered(!noMatchingNotes);
  }, [noMatchingNotes]);

  const getFilters = () => {
    const colors = new Set();
    const labels = new Set();
    const types = new Set();
    order.forEach((order) => {
      const note = notes.get(order);
      if (!note || note?.isTrash) return;
      note?.color && colors.add(note?.color);
      note?.labels.forEach((labelUUID) => labels.add(labelUUID));
      note?.images.length > 0 && types.add("Images");
    });
    setColorsSet(colors);
    setLabelsSet(labels);
    setTypesSet(types);
  };

  useEffect(() => {
    getFilters();
  }, [notesReady]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (noMatchingNotes && filtersExist) {
      getFilters();
    }
  }, [noMatchingNotes]);

  const resetText = () => {
    setSearchTerm("");
    searchRef.current.value = "";
  };

  const typeClick = (type) => {
    const title = type.toLowerCase().slice(0, type.length - 1);
    window.location.hash = `search/${title}`;
    setFilters((prev) => ({ ...prev, image: true }));
  };

  const colorClick = (color) => {
    skipHashChangeRef.current = true;
    const encodedColor =
      "color" + doubleEncode("=") + tripleEncode(color.toLowerCase());
    window.location.hash = `search/${encodedColor}`;
    setFilters((prev) => ({ ...prev, color: color }));
  };

  const labelClick = (labelUUID) => {
    skipHashChangeRef.current = true;
    const label = labelsRef.current.get(labelUUID).label;
    const encodedLabel = "label" + doubleEncode("=") + tripleEncode(label);
    window.location.hash = `search/${encodedLabel}`;
    setFilters((prev) => ({ ...prev, label: labelUUID }));
  };

  const tripleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(encodeURIComponent(str)));
  };

  const doubleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(str));
  };

  const filtersToRender = [
    { title: "Types", function: typeClick, set: typesSet },
    { title: "Labels", function: labelClick, set: labelsSet },
    { title: "Colors", function: colorClick, set: colorsSet },
  ];

  if (!notesReady) return;

  return (
    <>
      <div ref={rootContainerRef} className="starting-div">
        {noMatchingNotes || !filtersExist ? (
          <div
            className="search-section"
            style={{
              paddingTop: noMatchingNotes && filtersExist && "5.625rem",
            }}
          >
            <AnimatePresence>
              {noMatchingNotes && filtersExist && (
                <motion.div
                  className="no-matching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  No matching results.
                </motion.div>
              )}
            </AnimatePresence>
            {filtersToRender.map((item) => {
              if (
                item.set.size === 0 ||
                (item.title === "Colors" &&
                  item.set.size === 1 &&
                  item.set.has("Default"))
              ) {
                return;
              }

              renderedIndex++;
              return (
                <motion.div
                  key={item.title}
                  initial={{ y: 200 / (renderedIndex + 1.7), opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  transition={{
                    y: {
                      delay: renderedIndex / 10,
                      type: "spring",
                      stiffness: 700,
                      damping: 50,
                      mass: 1,
                    },
                    opacity: { delay: renderedIndex / 10, duration: 0.3 },
                  }}
                  className="filter-container"
                >
                  <div className="filter-container-title">{item.title}</div>
                  <div className="filter-items-container">
                    {[...item.set].map((setItem, index) => {
                      let ariaLabel = "";
                      if (item.title === "Labels") {
                        ariaLabel = labelsRef.current.get(setItem).label;
                      } else if (item.title === "Types") {
                        ariaLabel = setItem;
                      }
                      return (
                        <div
                          className="filter-item-wrapper"
                          onClick={() => {
                            resetText();
                            item.function(setItem);
                          }}
                          onMouseEnter={(e) => {
                            if (item.title !== "Colors") return;
                            showTooltip(e, setItem);
                          }}
                          onMouseLeave={hideTooltip}
                          key={setItem || index}
                        >
                          <div
                            className={`${
                              item.title === "Colors"
                                ? setItem + " filter-color"
                                : item.title === "Labels"
                                  ? "filter-label"
                                  : item.title === "Types"
                                    ? "filter-" + setItem.toLowerCase()
                                    : ""
                            }`}
                            aria-label={ariaLabel}
                          />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <FilteredNotes
            notesStateRef={notesStateRef}
            filteredNotes={filteredNotes}
            selectedNotesRef={selectedNotesRef}
            notes={notes}
            order={order}
            dispatchNotes={dispatchNotes}
            setSelectedNotesIDs={setSelectedNotesIDs}
            handleNoteClick={handleNoteClick}
            handleSelectNote={handleSelectNote}
            noteActions={noteActions}
            setFadingNotes={setFadingNotes}
            fadingNotes={fadingNotes}
            visibleItems={visibleItems}
            setVisibleItems={setVisibleItems}
            containerRef={containerRef}
          />
        )}
      </div>
    </>
  );
};

export default Search;
