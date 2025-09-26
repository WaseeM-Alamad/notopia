import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState } from "react";

const NoteCollabs = ({
  note,
  handleNoteClick,
  modalView = false,
  openCollab = () => {},
}) => {
  const { user, showTooltip, hideTooltip, closeToolTip, notesIndexMapRef } =
    useAppContext();
  const userID = user?.id;
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    const creatorID = note?.creator?._id;
    const collabs = [];
    if (creatorID !== userID) {
      collabs.push({
        data: {
          displayName: note?.creator?.displayName,
          username: note?.creator?.username,
          image: note?.creator?.image,
        },
      });
    }
    collabs.push(...note?.collaborators);
    const filteredCollabs = collabs.filter((collab) => {
      const collabUser = collab?.data?.username || collab?.snapshot?.username;
      return collabUser !== user.username;
    });
    setCollaborators(filteredCollabs);
  }, [note?.collaborators]);

  return (
    <>
      {collaborators.map((collab) => {
        const displayName =
          collab?.data?.displayName || collab?.snapshot?.displayName;
        const username = collab?.data?.username || collab?.snapshot?.username;
        const image = collab?.data?.image || collab?.snapshot?.image;
        return (
          <div
            key={username}
            className={`collab-user-img ${modalView ? "modal-collab-image" : "collab-note-image"}`}
            onClick={(e) => {
              e.stopPropagation();
              closeToolTip();
              if (modalView) {
                openCollab();
                return;
              }
              const element = note?.ref.current.parentElement;
              handleNoteClick(
                { currentTarget: element },
                note,
                notesIndexMapRef.current.get(note.uuid),
                true
              );
            }}
            onMouseEnter={(e) => showTooltip(e, displayName)}
            onMouseLeave={hideTooltip}
            style={image ? { backgroundImage: `url(${image})` } : undefined}
          />
        );
      })}
    </>
  );
};

export default NoteCollabs;
