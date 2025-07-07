"use client";

import { updateUsernameAction } from "@/utils/actions";
import { CircularProgress } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import HorizontalLoader from "../Tools/HorizontalLoader";

const AccountSettings = ({ rightHeader, selected, user, setUser }) => {
  const [reRender, triggerRerender] = useState(false);
  const [isEmailDisabled, setIsEmailDisabled] = useState(true);
  const [isNameDisabled, setIsNameDisabled] = useState(true);
  const [emailStatus, setEmailStatus] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(false);

  const nameRef = useRef(null);
  const emailRef = useRef(null);

  const newUsername = nameRef.current?.value?.trim();
  const oldUsername = user.name?.trim();

  useEffect(() => {
    setIsNameDisabled(true);
    setIsEmailDisabled(true);
    setUserStatus(null);
    setEmailStatus(null);
  }, [selected]);

  const usernameMatch = () => {
    return newUsername === oldUsername;
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setUserStatus(null);
    setIsNameDisabled(true);

    if (usernameMatch()) {
      setUserStatus("New username cannot be the same as your current username");
      return;
    }

    const isValid = validateUsername();
    if (!isValid) return;

    setIsUserLoading(true);

    const { success, message } = await updateUsernameAction(newUsername);
    setIsUserLoading(false);
    if (!success) {
      setUserStatus(message);
      setIsNameDisabled(false);
      requestAnimationFrame(() => nameRef.current.focus());
      return;
    }
    setIsNameDisabled(true);
    setUser((prev) => ({ ...prev, name: newUsername }));
  };

  const handleCancelUser = () => {
    setIsNameDisabled(true);
    setUserStatus(null);
    requestAnimationFrame(() => {
      !isUserLoading && (nameRef.current.value = user.name);
    });
  };

  const validateUsername = () => {
    const val = nameRef.current.value;

    if (!val.trim()) {
      const message = "Field can't be empty";
      setUserStatus(message);
      return false;
    }

    if (val.length < 3) {
      const message = "At least 3 characters";
      setUserStatus(message);
      return false;
    }

    if (val.length > 30) {
      const message = "At most 30 characters";
      setUserStatus(message);
      return false;
    }

    if (!/^[a-zA-Z]/.test(val.trim())) {
      const message = "Must start with a letter";
      setUserStatus(message);
      return false;
    }

    if (/[=<>\/"]/.test(val)) {
      const message = "Contains invalid characters";
      setUserStatus(message);
      return false;
    }

    return true;
  };

  return (
    <div style={{ display: !selected && "none" }} className="setting-wrapper">
      <div className="settings-right-title">{rightHeader().title}</div>
      <div className="settings-right-desc">{rightHeader().desc}</div>
      <div className="account-info-settings">
        <div>
          <form
            onSubmit={handleUsernameSubmit}
            id="username-from"
            className="settings-form"
          >
            <label
              className={`form-label ${userStatus ? "form-error-color" : ""} `}
            >
              Username
              {userStatus ? (
                <span style={{ fontStyle: "italic", fontSize: ".76rem" }}>
                  {" "}
                  - {userStatus}
                </span>
              ) : (
                ""
              )}
            </label>
            <div style={{ position: "relative", marginBottom: "0.2rem" }}>
              <div
                onClick={() => {
                  setIsNameDisabled(false);
                  requestAnimationFrame(() => nameRef.current.focus());
                }}
                style={{
                  opacity: isNameDisabled && !isUserLoading ? "1" : "0",
                  pointerEvents:
                    isNameDisabled && !isUserLoading ? "auto" : "none",
                }}
                className="form-edit"
              >
                Edit
              </div>
              {isUserLoading && (
                <div
                  style={{
                    position: "absolute",
                    right: "2rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    boxSizing: "border-box",
                  }}
                >
                  <CircularProgress
                    sx={{
                      color: document.documentElement.classList.contains(
                        "dark-mode"
                      )
                        ? "#dfdfdf"
                        : "#6d6d6d",
                      display: "block",
                    }}
                    size={20}
                    thickness={5}
                  />
                </div>
              )}
              <input
                ref={nameRef}
                onInput={() => triggerRerender((prev) => !prev)}
                disabled={isNameDisabled}
                defaultValue={user.name}
                type="text"
                className="form-input"
                style={{
                  paddingRight: isUserLoading || isEmailDisabled ? "5rem" : "",
                  marginBottom: "0",
                }}
              />
            </div>
            <div style={{ display: "flex" }}>
              <div className="form-input-desc">
                Your non-unique username on the platform.
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  marginTop: "0.1rem",
                  marginLeft: "auto",
                  marginRight: "0.6rem",
                  fontSize: ".76rem",
                  opacity: isNameDisabled ? "0" : "1",
                  pointerEvents: isNameDisabled ? "none" : "auto",
                  transition: "all .15s ease",
                }}
              >
                <button
                  type="button"
                  onClick={handleCancelUser}
                  className="update-acc-info"
                >
                  cancel
                </button>
                <button
                  disabled={usernameMatch()}
                  type="submit"
                  className="update-acc-info update-info-btn"
                >
                  update
                </button>
              </div>
            </div>
          </form>
        </div>
        <div>
          <label className="form-label">Email</label>
          <div style={{ position: "relative", marginBottom: "0.2rem" }}>
            <div
              onClick={() => {
                setIsEmailDisabled(false);
                requestAnimationFrame(() => emailRef.current.focus());
              }}
              style={{
                opacity: isEmailDisabled ? "1" : "0",
                pointerEvents: isEmailDisabled ? "auto" : "none",
              }}
              className="form-edit"
            >
              Edit
            </div>
            <input
              ref={emailRef}
              disabled={isEmailDisabled}
              defaultValue={user.email}
              type="text"
              className="form-input"
              style={{ marginBottom: "0" }}
            />
          </div>
          <div className="form-input-desc">
            Email that's associated with your account and its data
          </div>
        </div>
      </div>

      {/* <div className="settings-bottom-btns">
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(false);
          }}
          className="settings-bottom-btn settings-cancel"
        >
          Cancel
        </button>
        <button form="acc-info-from" disabled={true} className="settings-bottom-btn">
          Save Changes
        </button>
      </div> */}
    </div>
  );
};

export default AccountSettings;
