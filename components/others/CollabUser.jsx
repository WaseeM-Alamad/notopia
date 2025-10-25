import React, { memo } from "react";
import Button from "../Tools/Button";
import { useAppContext } from "@/context/AppContext";
import handleServerCall from "@/utils/handleServerCall";

const CollabUser = ({
  displayName,
  username,
  image,
  collabID,
  isOwner = false,
  noteUUID = null,
  removeSelfRef,
  setIsOpen,
  setCollabOpsMap,
  setCollaborators,
  isCreator,
}) => {
  const { user } = useAppContext();
  const ownUser = collabID === user.id;

  const handleRemoveCollab = async () => {
    if (!collabID || !noteUUID) return;

    if (ownUser) {
      removeSelfRef.current = true;
    }

    setCollabOpsMap((prev) => {
      const newMap = new Map(prev);
      const prevOp = newMap.get(collabID);
      if (prevOp === "add") {
        newMap.delete(collabID);
      } else {
        newMap.set(collabID, "remove");
      }
      return newMap;
    });
    setCollaborators((prev) => prev.filter((collab) => collab.id !== collabID));
  };

  return (
    <div className="collab-user">
      <div
        className="collab-user-img collab-layout-img"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      />
      <div style={{ fontSize: "0.9rem", width: "100%" }}>
        <div style={{ fontWeight: "600" }}>
          {displayName}{" "}
          {isOwner && (
            <span
              style={{
                fontStyle: "italic",
                fontSize: "0.8rem",
                fontWeight: "400",
              }}
            >
              (Owner)
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            letterSpacing: ".02rem",
            color: "rgb(83, 83, 83)",
          }}
        >
          {username}
        </div>
      </div>
      {(ownUser || (!isOwner && isCreator)) && (
        <Button
          onClick={handleRemoveCollab}
          className="clear-icon btn small-btn del-collab"
        />
      )}
    </div>
  );
};

export default memo(CollabUser);
