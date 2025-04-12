import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import FilteredNotes from "../others/FilteredNotes";
import { useSearch } from "@/context/SearchContext";

const Search = ({
  notes,
  order,
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
  const [colorsSet, setColorsSet] = useState(new Set());
  const [filters, setFilters] = useState({
    color: null,
    label: null,
  });
  const firstRun = useRef(true);

  useEffect(() => {
    const colors = new Set();
    order.forEach((order) => {
      const note = notes.get(order);
      if (note.isTrash) return;
      colors.add(note.color);
    });
    setColorsSet(colors);
  }, [notesReady]);

  const colorClick = (color) => {
    const encodedColor =
      "color" + doubleEncode("=") + tripleEncode(color.toLowerCase());
    window.location.hash = `search/${encodedColor}`;
    setFilters((prev) => ({ ...prev, color: color }));
  };

  const emptySearchRef = useRef(false);

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
        if (filter.includes("text")) {
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

            const updatedFilter = parts[0] + eq + tripleEncode(parts[1]);

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

            const updatedFilter = parts[0] + eq + tripleEncode(parts[1]);

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
    const handleHashChange = () => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        return;
      }

      const hash = window.location.hash.replace("#", "");
      const decodedHash = doubleDecode(hash.replace("search/", ""));
      if (hash.startsWith("search/")) {
        let dataObj = {};
        const filters = decodedHash.split("&");
        filters.forEach((filter) => {
          if (filter.includes("color")) {
            const decodedColor = decodeURIComponent(filter);
            let color = decodedColor.split(/=(.+)/)[1];
            dataObj.color = color?.charAt(0)?.toUpperCase() + color?.slice(1);
          }
          if (filter.includes("text")) {
            const decodedText = decodeURIComponent(filter);
            const text = decodedText.split(/=(.+)/)[1];
            dataObj.text = text;
          }
        });

        setFilters((prev) => ({ ...prev, color: dataObj.color ?? null }));
        const text = dataObj.text ?? "";
        setSearchTerm(text);
        searchRef.current.value = text;
      }
      if (hash === "search") {
        emptySearchRef.current = true;
        setFilters({
          color: null,
          label: null,
        });
        setSearchTerm("");
        searchRef.current.value = "";
      }
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const filtersExist = () => {
    return Object.values(filters).every((filter) => filter === null);
  };

  if (!notesReady) return;

  return (
    <>
      <div ref={rootContainerRef} className="starting-div">
        {filtersExist() && !searchTerm.trim() ? (
          <div className="search-section">
            <motion.div
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
              <div className="filter-container-label">Colors</div>
              <div className="filter-items-container">
                {[...colorsSet].map((color) => (
                  <div
                    style={{
                      width: "5rem",
                      height: "5rem",
                      display: "flex",
                    }}
                    onClick={() => colorClick(color)}
                    key={color}
                  >
                    <div className={`${color} filter-color`} />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <FilteredNotes
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
