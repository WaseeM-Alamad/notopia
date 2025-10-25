import React, { useEffect, useRef, useState } from "react";
import Button from "../Tools/Button";
import { head, transform } from "lodash";
import { useAppContext } from "@/context/AppContext";
import { submitCollabUserAction } from "@/utils/actions";
import { isEmail as isValidateEmail } from "validator";
import { CircularProgress } from "@mui/material";

const CollabUserInput = ({
  collaborators,
  setCollaborators,
  note,
  setCollabOpsMap,
}) => {
  const { user, showTooltip, hideTooltip, closeToolTip } = useAppContext();
  const [errorMsg, setErrorMsg] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef(null);

  const errorTimeout = useRef(null);

  useEffect(() => {
    if (!errorMsg) return;
    clearTimeout(errorTimeout.current);
    errorTimeout.current = setTimeout(() => {
      setErrorMsg(null);
    }, 6000);
  }, [errorMsg]);

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    closeToolTip();

    if (isLoading) return;

    const isEmail = isValidateEmail(input);
    const normalizedInput = input.toLowerCase().trim();
    if (!isEmail) {
      if (user.username.toLowerCase().trim() === normalizedInput) {
        setErrorMsg("Username already exists");
        setIsLoading(false);
        return null;
      }
    } else {
      if (user.email.toLowerCase().trim() === normalizedInput) {
        setErrorMsg("Email already exists");
        setIsLoading(false);
        return null;
      }
    }

    const exists = collaborators.some((collab) => {
      if (!isEmail) {
        const username = collab.data.username || collab.snapshot.username;
        return username.toLowerCase().trim() === normalizedInput;
      } else {
        return collab?.data.email?.toLowerCase()?.trim() === normalizedInput;
      }
    });

    if (exists) {
      setErrorMsg(isEmail ? "Email already exists" : "Username already exists");
      setIsLoading(false);
      return null;
    }

    const existingCollab =
      note?.collaborators.find((collab) => {
        if (isEmail) {
          return collab?.data?.email === input;
        } else {
          const username = collab?.data?.username || collab?.snapshot?.username;
          return username === input;
        }
      }) ||
      collaborators.find((collab) => {
        if (isEmail) {
          return collab?.data?.email === input;
        } else {
          const username = collab?.data?.username || collab?.snapshot?.username;
          return username === input;
        }
      });

    const collabID = existingCollab?.id;

    if (collabID) {
      let willExitFunc = false;
      setCollabOpsMap((prev) => {
        const newMap = new Map(prev);
        const operation = newMap.get(collabID);
        if (operation !== "remove") {
          return prev;
        }

        newMap.delete(collabID);
        setCollaborators((prev) => [existingCollab, ...prev]);
        willExitFunc = true;
        return newMap;
      });
      if (willExitFunc) return;
    }

    setIsLoading(true);
    const { success, message, newUser } = await submitCollabUserAction(
      input,
      note?.uuid
    );
    setIsLoading(false);
    if (!success) {
      let willExitFunc = false;
      setCollabOpsMap((prev) => {
        const newMap = new Map(prev);
        const operation = newMap.get(newUser?.id);
        if (operation !== "remove") return prev;
        newMap.delete(newUser?.id);
        setCollaborators((prev) => [newUser, ...prev]);
        willExitFunc = true;
        return newMap;
      });
      if (willExitFunc) {
        inputRef.current.value = "";
        return;
      }
      setErrorMsg(message);
      return;
    }

    if (newUser.id === user.id) {
      removeSelfRef.current = false;
    }

    setCollabOpsMap((prev) => {
      const newMap = new Map(prev);
      const prevOp = newMap.get(newUser.id);
      if (prevOp === "remove") {
        newMap.delete(newUser.id);
      } else {
        newMap.set(newUser.id, "add");
      }
      return newMap;
    });

    setCollaborators((prev) => [
      ...prev,
      {
        ...newUser,
        ...(isEmail ? { data: { ...newUser.data, email: input } } : {}),
      },
    ]);
    inputRef.current.value = "";
  };

  return (
    <div className="collab-user">
      <div className="collab-user-img collab-input-img" />
      <form
        onSubmit={handleSubmitUser}
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "0.9rem",
          width: "100%",
          position: "relative",
        }}
      >
        <input
          ref={inputRef}
          disabled={isLoading}
          type="text"
          name="collab-input"
          onInput={(e) => setInput(e.target.value)}
          placeholder="Username or email to share with"
          className="collab-input"
        />
        {isLoading ? (
          <CircularProgress
            sx={{
              color: document.documentElement.classList.contains("dark-mode")
                ? "#dfdfdf"
                : "#6d6d6d",
              display: "block",
              flexShrink: 0,
              marginRight: "1.1rem",
            }}
            size={14}
            thickness={5}
          />
        ) : (
          input.trim() && (
            <Button
              type="submit"
              onMouseEnter={(e) => showTooltip(e, "Add collaborator")}
              onMouseLeave={hideTooltip}
              className="small-btn check-icon collab-check-btn"
              style={{ marginRight: ".8rem" }}
            />
          )
        )}
        <div
          style={{
            fontSize: "0.8rem",
            position: "absolute",
            bottom: "-1.3rem",
          }}
          className="warning-color"
        >
          {errorMsg}
        </div>
      </form>
    </div>
  );
};

export default CollabUserInput;
