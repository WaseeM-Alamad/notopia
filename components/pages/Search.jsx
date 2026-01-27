import FilteredNotes from "../others/FilteredNotes";
import { useSearch } from "@/context/SearchContext";
import { useMasonry } from "@/context/MasonryContext";
import Filters from "../others/filters/Filters";

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
  const { searchTerm, filters } = useSearch();

  const { notesExist } = useMasonry();

  const filtersExist =
    Object.values(filters).some((filter) => filter !== null) ||
    searchTerm.trim();

  const noMatchingNotes = !notesExist;

  if (!notesReady) return;

  return (
    <>
      <div ref={rootContainerRef} className="starting-div">
        {noMatchingNotes || !filtersExist ? (
          <Filters
            noMatchingNotes={noMatchingNotes}
            filtersExist={filtersExist}
            notesReady={notesReady}
            order={order}
            notes={notes}
          />
        ) : (
          <FilteredNotes
            notesStateRef={notesStateRef}
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
