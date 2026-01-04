import React, { memo, useState } from "react";
import CollabUser from "./CollabUser";
import CollabUserInput from "./CollabUserInput";
import { useAppContext } from "@/context/AppContext";
import Button from "../Tools/Button";

const CollabLayout = ({
  note,
  collabRef,
  closeCollab,
  saveCollabFun,
  removeSelfRef,
  setIsOpen,
  isOpenWithCollab,
}) => {
  const { user } = useAppContext();
  const [collaborators, setCollaborators] = useState(note?.collaborators || []);
  const [collabOpsMap, setCollabOpsMap] = useState(new Map());

  const isCreator = note?.creator?._id === user.id;

  const handleCancel = () => {
    removeSelfRef.current = false;
    closeCollab();
  };
  const handleSave = () => saveCollabFun(collabOpsMap, collaborators);

  return (
    <div
      ref={collabRef}
      className={`collab-box ${isOpenWithCollab ? "open-with-collab" : ""}`}
    >
      <div className="collab-container">
        <div className="collab-title">
          <Button onClick={handleCancel} className="clear-icon collab-close" />
          <span>Collaborators</span>
          <button
            onClick={handleSave}
            className="action-modal-bottom-btn collab-top-save"
          >
            Save
          </button>
        </div>
        <div className="collab-users-container">
          <CollabUser
            displayName={note?.creator?.displayName}
            username={note?.creator?.username}
            image={note?.creator?.image}
            isOwner={true}
          />
          {collaborators.map((collab, index) => (
            <CollabUser
              key={index}
              displayName={
                collab?.data?.displayName || collab?.snapshot?.displayName
              }
              username={collab?.data?.username || collab?.snapshot?.username}
              image={collab?.data?.image || collab?.snapshot?.image}
              collabID={collab.id}
              noteUUID={note?.uuid}
              removeSelfRef={removeSelfRef}
              setIsOpen={setIsOpen}
              setCollabOpsMap={setCollabOpsMap}
              setCollaborators={setCollaborators}
              isCreator={isCreator}
            />
          ))}
          <CollabUserInput
            collaborators={collaborators}
            setCollaborators={setCollaborators}
            note={note}
            setCollabOpsMap={setCollabOpsMap}
          />
        </div>
      </div>
      <div className="collab-bottom">
        <button
          onClick={handleCancel}
          style={{ fontWeight: "500" }}
          className="modal-bottom-btn collab-btn"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{ fontWeight: "500" }}
          className="modal-bottom-btn collab-btn"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default memo(CollabLayout);
