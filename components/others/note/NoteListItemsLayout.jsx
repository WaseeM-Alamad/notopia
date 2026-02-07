import { useAppContext } from "@/context/AppContext";
import { NoteUpdateAction } from "@/utils/actions";
import handleServerCall from "@/utils/handleServerCall";
import localDbReducer from "@/utils/localDbReducer";
import React, { memo } from "react";

const NoteListItemsLayout = ({ note, dispatchNotes }) => {
  const { notesStateRef, user, openSnackRef, clientID } = useAppContext();

  const userID = user?.id;

  const activeItems = note?.checkboxes?.filter((cb) => !cb.isCompleted);
  const completedItems = note?.checkboxes?.filter((cb) => cb.isCompleted);
  const activeParentItems = activeItems?.filter((item) => item.parent === null);
  const completedParentItems = completedItems?.filter(
    (item) => item.parent === null,
  );

  const getCompletedChildren = (parentUUID) => {
    return completedItems?.filter((item) => item.parent === parentUUID);
  };

  const getCompletedChildrenForActiveParent = (parentUUID) => {
    return completedItems?.filter((item) => item.parent === parentUUID);
  };

  const handleCheckboxClick = async (e, checkboxUUID, value) => {
    e.stopPropagation();
    dispatchNotes({
      type: "CHECKBOX_STATE",
      noteUUID: note?.uuid,
      checkboxUUID: checkboxUUID,
      value: value,
    });

    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "CHECKBOX_STATE",
      noteUUID: note?.uuid,
      checkboxUUID: checkboxUUID,
      value: value,
    });

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "checkboxes",
            operation: "MANAGE_COMPLETED",
            value: value,
            checkboxUUID: checkboxUUID,
            noteUUIDs: [note?.uuid],
            clientID: clientID,
          }),
      ],
      openSnackRef.current,
    );
  };

  const handleExpand = async (e) => {
    e.stopPropagation();
    const val = !note?.expandCompleted;
    dispatchNotes({
      type: "EXPAND_ITEMS",
      noteUUID: note?.uuid,
    });

    localDbReducer({
      notes: notesStateRef.current.notes,
      order: notesStateRef.current.order,
      userID: userID,
      type: "EXPAND_ITEMS",
      noteUUID: note?.uuid,
    });

    handleServerCall(
      [
        () =>
          NoteUpdateAction({
            type: "expandCompleted",
            value: val,
            noteUUIDs: [note?.uuid],
            clientID: clientID,
          }),
      ],
      openSnackRef.current,
    );
  };

  return (
    <div
      style={{
        paddingTop: ".625rem",
        paddingBottom: ".4rem",
      }}
    >
      <div>
        {activeItems.map((checkbox, index) => {
          return (
            <div
              key={checkbox?.uuid}
              className="checkbox-wrapper note-checkbox-wrapper"
              aria-label="empty"
              style={{
                paddingLeft: checkbox.parent ? "1.8rem" : "0.7rem",
                paddingRight:
                  !note?.content.trim() &&
                  !note?.title.trim() &&
                  index === 0 &&
                  "2.5rem",
              }}
            >
              <div
                onClick={(e) =>
                  handleCheckboxClick(e, checkbox.uuid, !checkbox.isCompleted)
                }
                className={`note-checkbox checkbox-unchecked ${
                  checkbox.isCompleted ? "checkbox-checked" : ""
                }`}
              />
              <div
                style={{
                  width: "100%",
                  paddingLeft: "0.5rem",
                  fontSize: ".875rem",
                }}
                className={`checkbox-content ${checkbox.isCompleted ? "checked-content" : ""}`}
                aria-label="empty"
              >
                {checkbox.content}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        {completedItems.length > 0 && activeItems.length > 0 && (
          <div
            onClick={handleExpand}
            className="checkboxes-divider"
            style={{ cursor: "pointer" }}
          />
        )}
      </div>
      {note?.expandCompleted &&
        completedParentItems.map((parent) => (
          <div key={`completed-parent-item-${parent.uuid}`}>
            <div
              key={parent.uuid}
              className="checkbox-wrapper note-checkbox-wrapper"
              aria-label="empty"
              style={{
                paddingLeft: "0.7rem",
              }}
            >
              <div
                onClick={(e) =>
                  handleCheckboxClick(e, parent.uuid, !parent.isCompleted)
                }
                className={`note-checkbox checkbox-unchecked ${
                  parent.isCompleted ? "checkbox-checked" : ""
                }`}
              />
              <div
                style={{
                  width: "100%",
                  paddingLeft: "0.5rem",
                  fontSize: ".875rem",
                }}
                className={`checkbox-content ${parent.isCompleted ? "checked-content" : ""}`}
                aria-label="empty"
              >
                {parent.content}
              </div>
            </div>

            {getCompletedChildren(parent.uuid).map((child) => (
              <div
                key={child.uuid}
                className="checkbox-wrapper note-checkbox-wrapper"
                aria-label="empty"
                style={{
                  paddingLeft: "1.8rem",
                }}
              >
                <div
                  onClick={(e) =>
                    handleCheckboxClick(e, child.uuid, !child.isCompleted)
                  }
                  className={`note-checkbox checkbox-unchecked ${
                    child.isCompleted ? "checkbox-checked" : ""
                  }`}
                />
                <div
                  style={{
                    width: "100%",
                    paddingLeft: "0.5rem",
                    fontSize: ".875rem",
                  }}
                  className={`checkbox-content ${child.isCompleted ? "checked-content" : ""}`}
                  aria-label="empty"
                >
                  {child.content}
                </div>
              </div>
            ))}
          </div>
        ))}

      {activeParentItems.map((parent) => {
        const completedChildren = getCompletedChildrenForActiveParent(
          parent.uuid,
        );
        if (completedChildren.length === 0) return null;

        return (
          <div key={`active-parent-item-${parent.uuid}`}>
            <div
              key={parent.uuid}
              className="checkbox-wrapper note-checkbox-wrapper"
              aria-label="empty"
              style={{ pointerEvents: "none", opacity: ".5" }}
            >
              <div
                className={`note-checkbox checkbox-unchecked ${
                  parent.isCompleted ? "checkbox-checked" : ""
                }`}
                style={{ cursor: "not-allowed" }}
              />
              <div
                style={{
                  width: "100%",
                  paddingLeft: "0.5rem",
                  fontSize: ".875rem",
                }}
                className={`checkbox-content ${parent.isCompleted ? "checked-content" : ""}`}
                aria-label="empty"
              >
                {parent.content}
              </div>
            </div>

            {completedChildren.map((child, childIndex) => (
              <div
                key={child.uuid}
                className="checkbox-wrapper note-checkbox-wrapper"
                aria-label="empty"
                style={{
                  paddingLeft: "1.8rem",
                }}
              >
                <div
                  onClick={(e) =>
                    handleCheckboxClick(e, child.uuid, !child.isCompleted)
                  }
                  className={`note-checkbox checkbox-unchecked ${
                    child.isCompleted ? "checkbox-checked" : ""
                  }`}
                />
                <div
                  style={{
                    width: "100%",
                    paddingLeft: "0.5rem",
                    fontSize: ".875rem",
                  }}
                  className={`checkbox-content ${child.isCompleted ? "checked-content" : ""}`}
                  aria-label="empty"
                >
                  {child.content}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default memo(NoteListItemsLayout);
