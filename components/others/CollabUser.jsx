import React, { memo, useState } from "react";
import Button from "../Tools/Button";
import { useAppContext } from "@/context/AppContext";
import handleServerCall from "@/utils/handleServerCall";
import UserModal from "./UserModal";
import { AnimatePresence } from "framer-motion";

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
  setDialogUser,
}) => {
  const { user } = useAppContext();
  const isOwnUser = collabID === user.id;
  const canDelete = isOwnUser || (!isOwner && isCreator);

  const handleRemoveCollab = async () => {
    if (!collabID || !noteUUID) return;

    if (isOwnUser) {
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
    <>
      <div
        onClick={() =>
          setDialogUser({
            image: image,
            displayName: displayName,
            username: username,
            canDelete: canDelete,
            isOwner: isOwner,
            isOwnUser: isOwnUser,
            handleRemoveCollab: handleRemoveCollab,
          })
        }
        className="collab-user collab-user-hover"
      >
        <div
          className="collab-user-img collab-layout-img"
          style={image ? { backgroundImage: `url(${image})` } : undefined}
        />
        <div style={{ fontSize: "0.9rem", width: "100%" }}>
          <div style={{ fontWeight: "600" }}>
            {displayName}
            {(isOwner || isOwnUser) && (
              <span
                style={{
                  fontStyle: "italic",
                  fontSize: "0.8rem",
                  fontWeight: "400",
                }}
              >
                {isOwner ? " (Owner)" : " (You)"}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              letterSpacing: ".02rem",
              color: "var(--text3)",
            }}
          >
            {username}
          </div>
        </div>
        {/* {canDelete && (
        <Button
          onClick={handleRemoveCollab}
          className="clear-icon btn small-btn del-collab"
        />
      )} */}
      </div>
    </>
  );
};

export default memo(CollabUser);
