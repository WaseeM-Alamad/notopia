import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import FilteredNotes from "../others/FilteredNotes";

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
  const [colorsSet, setColorsSet] = useState(new Set());
  const [show, setShow] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    const colors = new Set();
    order.forEach((order) => {
      const note = notes.get(order);
      if (note.isTrash) return;
      colors.add(note.color);
    });
    setColorsSet(colors);
  }, [notesReady]);

  useEffect(() => {
    const handleHashChange = (e) => {
      const hash = window.location.hash.replace("#", "");
      if (hash.startsWith("search/")) {
        setShow(true);
      }
      if (hash === "search") {
        setShow(false);
      }
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(()=> {console.log(selectedColor), [selectedColor]})

  if (!notesReady) return;

  return (
    <>
      <div ref={rootContainerRef} className="starting-div">
        {!show ? (
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
                    onClick={() => {
                      window.location.hash = `search/color/${color.toLowerCase()}`;
                      setSelectedColor(color);
                    }}
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
            selectedColor={selectedColor}
          />
        )}
      </div>
    </>
  );
};

export default Search;
