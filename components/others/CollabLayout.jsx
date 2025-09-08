import React, { memo } from "react";
import Button from "../Tools/Button";
import { useAppContext } from "@/context/AppContext";
import CollabUser from "./CollabUser";
import CollabUserInput from "./CollabUserInput";

const CollabLayout = ({ collabRef, setInitialStyle, closeCollab }) => {
  const { user } = useAppContext();

  return (
    <div ref={collabRef} className="collab-box">
      <div className="collab-container">
        <div className="collab-title">Collaborators</div>
        <div className="collab-users-container">
          <CollabUser
            displayName={user.displayName}
            username={user.name}
            image={user.image}
            isOwner={true}
          />
          <CollabUserInput />
        </div>
      </div>
      <div className="collab-bottom">
        <button
          onClick={() => closeCollab()}
          style={{ fontWeight: "500" }}
          className="modal-bottom-btn collab-btn"
        >
          Cancel
        </button>
        <button
          style={{ fontWeight: "500" }}
          className="modal-bottom-btn collab-btn"
        >
          Save
        </button>
      </div>
      {/* <Button onClick={() => closeCollab()}> close </Button> */}
    </div>
  );
};

export default memo(CollabLayout);
