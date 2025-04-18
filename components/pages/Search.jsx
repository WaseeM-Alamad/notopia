import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import FilteredNotes from "../others/FilteredNotes";
import { useSearch } from "@/context/SearchContext";
import { useAppContext } from "@/context/AppContext";

const Search = ({
  notes,
  order,
  filters,
  setFilters,
  dispatchNotes,
  setTooltipAnchor,
  openSnackFunction,
  setSelectedNotesIDs,
  handleNoteClick,
  handleSelectNote,
  fadingNotes,
  setFadingNotes,
  rootContainerRef,
  noteActions,
  notesReady,
}) => {
  const { searchTerm, setSearchTerm, searchRef, isTypingRef } = useSearch();
  const { labelsRef } = useAppContext();
  const [colorsSet, setColorsSet] = useState(new Set());
  const [labelsSet, setLabelsSet] = useState(new Set());
  const [noMatchingNotes, setNoMatchingNotes] = useState(false);
  const firstRun = useRef(true);

  useEffect(() => {
    const colors = new Set();
    const labels = new Set();
    order.forEach((order) => {
      const note = notes.get(order);
      if (note.isTrash) return;
      colors.add(note.color);
      note.labels.forEach((labelUUID) => {
        labels.add(labelUUID);
      });
    });
    setColorsSet(colors);
    setLabelsSet(labels);
  }, [notesReady]);

  const colorClick = (color) => {
    const encodedColor =
      "color" + doubleEncode("=") + tripleEncode(color.toLowerCase());
    window.location.hash = `search/${encodedColor}`;
    setFilters((prev) => ({ ...prev, color: color }));
  };

  const labelClick = (labelUUID) => {
    const label = labelsRef.current.get(labelUUID).label;
    const encodedColor =
      "label" + doubleEncode("=") + tripleEncode(label.toLowerCase());
    window.location.hash = `search/${encodedColor}`;
    setFilters((prev) => ({ ...prev, label: labelUUID }));
  };

  // const emptySearchRef = useRef(false);

  const tripleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(encodeURIComponent(str)));
  };

  const doubleEncode = (str) => {
    return encodeURIComponent(encodeURIComponent(str));
  };

  const tripleDecode = (str) => {
    return decodeURIComponent(decodeURIComponent(decodeURIComponent(str)));
  };

  const doubleDecode = (str) => {
    return decodeURIComponent(decodeURIComponent(str));
  };

  // useEffect(() => {
  //   if (firstRun.current) {
  //     firstRun.current = false;
  //     return;
  //   }

  //   if (emptySearchRef.current && !searchTerm.trim()) {
  //     emptySearchRef.current = false;
  //     return;
  //   } else {
  //     emptySearchRef.current = false;
  //   }

  //   const hash = window.location.hash.replace("#", "");
  //   let encodedNewHash = "";
  //   let filteredRest = [];
  //   if (hash.startsWith("search/")) {
  //     const decodedHash = doubleDecode(hash.replace("search/", ""));
  //     const filters = decodedHash.split("&");

  //     filters.forEach((filter) => {
  //       if (filter.includes("text")) {
  //         return;
  //       }
  //       filteredRest.push(decodeURIComponent(filter));
  //     });

  //     if (!searchTerm.trim()) {
  //       if (filteredRest.length === 0) {
  //         encodedNewHash = "search";
  //       } else {
  //         //searchTerm  not-encoded
  //         //filteredRest not-encoded
  //         const and = doubleEncode("&");
  //         const eq = doubleEncode("=");
  //         const encodedFilters = filteredRest.map((filter) => {
  //           const parts = filter.split(/=(.+)/);

  //           const updatedFilter = parts[0] + eq + tripleEncode(parts[1]);

  //           return updatedFilter;
  //         });

  //         const joinedFilters = encodedFilters.join(and);
  //         encodedNewHash = "search/" + joinedFilters;
  //       }
  //     } else {
  //       const encodedTerm = tripleEncode(searchTerm.toLowerCase().trim());

  //       if (filteredRest.length === 0) {
  //         encodedNewHash = "search/" + doubleEncode("text=") + encodedTerm;
  //       } else {
  //         const and = doubleEncode("&");
  //         const eq = doubleEncode("=");

  //         const encodedFilters = filteredRest.map((filter) => {
  //           const parts = filter.split(/=(.+)/);

  //           const updatedFilter = parts[0] + eq + tripleEncode(parts[1]);

  //           return updatedFilter;
  //         });

  //         const joinedFilters = encodedFilters.join(and);
  //         encodedNewHash =
  //           "search/" +
  //           doubleEncode("text=") +
  //           encodedTerm +
  //           and +
  //           joinedFilters;
  //       }
  //     }
  //   } else {
  //     const encodedTerm = tripleEncode(searchTerm.toLowerCase().trim());

  //     encodedNewHash = "search/" + doubleEncode("text=") + encodedTerm;
  //   }

  //   window.location.hash = encodedNewHash;
  // }, [searchTerm]);

  useEffect(() => {
    const handleHashChange = () => {
      // if (isTypingRef.current) {
      //   isTypingRef.current = false;
      //   return;
      // }

      // const hash = window.location.hash.replace("#", "");
      // const decodedHash = doubleDecode(hash.replace("search/", ""));
      // if (hash.startsWith("search/")) {
      //   let dataObj = {};
      //   const filters = decodedHash.split("&");
      //   filters.forEach((filter) => {
      //     if (filter.includes("color")) {
      //       const decodedColor = decodeURIComponent(filter);
      //       let color = decodedColor.split(/=(.+)/)[1];
      //       dataObj.color = color?.charAt(0)?.toUpperCase() + color?.slice(1);
      //     }
      //     if (filter.includes("text")) {
      //       const decodedText = decodeURIComponent(filter);
      //       const text = decodedText.split(/=(.+)/)[1];
      //       dataObj.text = text;
      //     }
      //   });

      //   setFilters((prev) => ({ ...prev, color: dataObj.color ?? null }));
      //   const text = dataObj.text ?? "";
      //   setSearchTerm(text);
      //   searchRef.current.value = text;
      // }
      // if (hash === "search") {
      //   emptySearchRef.current = true;
      //   setFilters({
      //     color: null,
      //     label: null,
      //   });
      //   setSearchTerm("");
      //   searchRef.current.value = "";
      // }
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const filtersExist = () => {
    return (
      Object.values(filters).some((filter) => filter !== null) ||
      searchTerm.trim() !== ""
    );
  };

  const matchesFilters = (note) => {
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

    if (filters.label && !note.labels.includes(filters.label)) 
    {
      return false;
    }


    return true;
  };

  const filteredNotes = order.filter((uuid) => {
    const note = notes.get(uuid);
    return note && matchesFilters(note) && filtersExist();
  });

  useEffect(() => {
    setNoMatchingNotes(filteredNotes.length === 0);
  }, [filteredNotes]);

  const filtersToRender = [
    { title: "Labels", function: labelClick, set: labelsSet },
    { title: "Colors", function: colorClick, set: colorsSet },
  ];

  if (!notesReady) return;

  return (
    <>
      <div ref={rootContainerRef} className="starting-div">
        {!filtersExist() || noMatchingNotes ? (
          <div className="search-section">
            {noMatchingNotes && filtersExist() && (
              <div style={{ padding: "2rem", fontSize: "0.9rem" }}>
                No matching results.
              </div>
            )}
            {filtersToRender.map((item) => {
              if (item.set.size === 0) {
                return;
              }
              return (
                <motion.div
                  key={item.title}
                  initial={{ y: 200, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  transition={{
                    y: { type: "spring", stiffness: 700, damping: 50, mass: 1 },
                    opacity: { duration: 0.2 },
                  }}
                  className="filter-container"
                >
                  <div className="filter-container-title">{item.title}</div>
                  <div className="filter-items-container">
                    {[...item.set].map((setItem) => {
                      let ariaLabel = "";
                      if (item.title === "Labels") {
                        ariaLabel = labelsRef.current.get(setItem).label;
                      }
                      return (
                        <div
                          className="filter-item-wrapper"
                          onClick={() => item.function(setItem)}
                          key={setItem}
                        >
                          <div
                            className={`${
                              item.title === "Colors"
                                ? setItem + " filter-color"
                                : item.title === "Labels"
                                ? "filter-label"
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
            setNoMatchingNotes={setNoMatchingNotes}
            filteredNotes={filteredNotes}
            notes={notes}
            order={order}
            dispatchNotes={dispatchNotes}
            setTooltipAnchor={setTooltipAnchor}
            openSnackFunction={openSnackFunction}
            setSelectedNotesIDs={setSelectedNotesIDs}
            handleSelectNote={handleSelectNote}
            noteActions={noteActions}
            setFadingNotes={setFadingNotes}
            fadingNotes={fadingNotes}
            filters={filters}
          />
        )}
      </div>
    </>
  );
};

export default Search;
