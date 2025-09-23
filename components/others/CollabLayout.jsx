import React, { memo, useState } from "react";
import CollabUser from "./CollabUser";
import CollabUserInput from "./CollabUserInput";
import { useAppContext } from "@/context/AppContext";

const CollabLayout = ({
  note,
  collabRef,
  closeCollab,
  saveCollabFun,
  removeSelfRef,
  setIsOpen,
}) => {
  const { user } = useAppContext();
  const [collaborators, setCollaborators] = useState(note?.collaborators || []);
  const [collabOpsMap, setCollabOpsMap] = useState(new Map());

  const isCreator = note?.creator?._id === user.id;

  return (
    <div ref={collabRef} className="collab-box">
      <div className="collab-container">
        {/* <button
          onClick={() =>
            console.log(
              "collabOpsMap",
              collabOpsMap,
              "removeSelfRef",
              removeSelfRef.current
            )
          }
        >
          check
        </button> */}
        <div className="collab-title">Collaborators</div>
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
          onClick={() => {
            removeSelfRef.current = false;
            closeCollab();
          }}
          style={{ fontWeight: "500" }}
          className="modal-bottom-btn collab-btn"
        >
          Cancel
        </button>
        <button
          onClick={() => saveCollabFun(collabOpsMap, collaborators)}
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
