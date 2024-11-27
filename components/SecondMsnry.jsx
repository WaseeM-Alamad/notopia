<div className="notes-wrapper">
          <div
            style={{
              width: isGridLayout ? "37.5rem" : "98%",
            }}
            className="inner-notes-wrapper"
          >
            <div ref={pinnedGridRef} className="grid">
              {[...notes].reverse().map((note) => {
                if (note.isPinned) {
                  return (<div key={note._id} className={`pinned-grid-item `}>
                  <Note isGridLayout={isGridLayout} note={note} />
                </div>)
                
              }})}
            </div>
          </div>
        </div>