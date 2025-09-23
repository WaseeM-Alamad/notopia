import { getNoteFormattedDate } from "@/utils/noteDateFormatter";
import React from "react";

const NoteOverlay = ({ note }) => {
  return (
    <div className="note-overlay">
      <div
        className="collab-user-img modal-collab-image"
        style={
          note?.creator?.image
            ? { backgroundImage: `url(${note?.creator?.image})` }
            : undefined
        }
      />
      <div style={{ color: "#fff", fontSize: "15px", marginTop: "4px" }}>
        Shared from
      </div>
      <div
        style={{
          color: "#fff",
          fontSize: "15px",
          fontWeight: "bold",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {note?.creator?.username}
      </div>
      <div style={{ color: "#fff", fontSize: "11px", marginTop: "4px" }}>
        {note?.shareDate && getNoteFormattedDate(note?.shareDate)}
      </div>
    </div>
  );
};

export default NoteOverlay;
