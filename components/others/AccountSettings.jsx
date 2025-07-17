"use client";

import { emailNewEmailAction, updateUsernameAction } from "@/utils/actions";
import { CircularProgress } from "@mui/material";
import React, { memo, useEffect, useRef, useState } from "react";
import HorizontalLoader from "../Tools/HorizontalLoader";
import Modal from "../Tools/Modal";
import HorizontalLoader2 from "../Tools/HorizontalLoader2";
import isEmail from "validator/lib/isEmail";
import { useAppContext } from "@/context/AppContext";

const AccountSettings = ({ rightHeader, selected, user, setUser }) => {
  const { openSnackRef } = useAppContext();
  const [reRender, triggerRerender] = useState(false);
  const [isNameDisabled, setIsNameDisabled] = useState(true);
  const [userStatus, setUserStatus] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailPassStatus, setEmailPassStatus] = useState(null);
  const [newEmailStatus, setNewEmailStatus] = useState(null);

  const nameRef = useRef(null);
  const emailRef = useRef(null);

  const emailPassRef = useRef(null);
  const newEmailRef = useRef(null);

  const newUsername = nameRef.current?.value?.trim();
  const oldUsername = user.name?.trim();

  useEffect(() => {
    setIsNameDisabled(true);
    setUserStatus(null);
  }, [selected]);

  const usernameMatch = () => {
    return newUsername === oldUsername;
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setUserStatus(null);

    if (usernameMatch()) {
      setUserStatus("New username cannot be the same as your current username");
      return;
    }

    const isValid = validateUsername();
    if (!isValid) return;

    setIsUserLoading(true);
    setIsNameDisabled(true);
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

    if (!/^\p{L}/u.test(val.trim())) {
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

  const validateEmail = () => {
    const val = newEmailRef.current.value;
    if (!val.trim()) {
      const message = "Field can't be empty";
      setNewEmailStatus(message);
      return false;
    }

    if (!isEmail(val)) {
      const message = "Invalid email";
      setNewEmailStatus(message);
      return false;
    }
    return true;
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setNewEmailStatus(null);
    setEmailPassStatus(null);

    const isEmailValid = validateEmail();

    if (!isEmailValid) return;

    setIsEmailLoading(true);

    const payload = {
      password: emailPassRef.current.value,
      newEmail: newEmailRef.current.value,
    };

    const { success, type, message, tempEmail } =
      await emailNewEmailAction(payload);
    setIsEmailLoading(false);
    if (!success) {
      switch (type) {
        case "password":
          setEmailPassStatus(message);
          break;
        case "email":
          setNewEmailStatus(message);
          break;
        case "both":
          setEmailPassStatus(message);
          setNewEmailStatus(message);
          break;
        default:
          break;
      }
      return;
    }

    openSnackRef.current({
      snackMessage: "A verification link has been sent to the new email",
      showUndo: false,
    });
    setUser((prev) => ({ ...prev, tempEmail: tempEmail }));
    emailRef.current.value = tempEmail;
    setIsEmailOpen(false);
  };

  useEffect(() => {
    if (!isEmailOpen) {
      setEmailPassStatus(null);
      setNewEmailStatus(null);
    }
  }, [isEmailOpen]);

  return (
    <>
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
                    paddingRight: "5rem",
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
                    disabled={usernameMatch() || !newUsername}
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
              <div onClick={() => setIsEmailOpen(true)} className="form-edit">
                Edit
              </div>
              <input
                ref={emailRef}
                disabled={true}
                defaultValue={user.tempEmail || user.email}
                type="text"
                className={`form-input ${user.tempEmail ? "warning-color" : ""}`}
                style={{ marginBottom: "0", paddingRight: "5rem" }}
              />
            </div>
            <div className="form-input-desc">
              Email that's associated with your account and its data
            </div>
          </div>
        </div>
      </div>
      <Modal
        initial={{
          scale: 0.95,
          opacity: 0,
        }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 40,
          mass: 1.05,
        }}
        overlay={true}
        isOpen={isEmailOpen}
        setIsOpen={setIsEmailOpen}
        className="instructions-container"
        style={{
          maxWidth: "28.4375rem",
          maxHeight: "23rem",
        }}
      >
        <form style={{ height: "100%" }} onSubmit={handleChangeEmail}>
          <div className="instructions-dialog">
            <div
              style={{
                fontSize: "1.3rem",
                fontWeight: "550",
                marginBottom: "0.6rem",
              }}
            >
              Email Address
            </div>
            <div className="change-email-desc">
              We'll send a verification email to the email address you provide
              to confirm that it's really you
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <div>
                <label
                  className={`form-label ${emailPassStatus ? "form-error-color" : ""} `}
                >
                  Password
                  {emailPassStatus ? (
                    <span style={{ fontStyle: "italic", fontSize: ".76rem" }}>
                      {" "}
                      - {emailPassStatus}
                    </span>
                  ) : (
                    ""
                  )}
                </label>
                <input
                  ref={emailPassRef}
                  className="form-input change-email-input"
                  onInput={() => setEmailPassStatus(null)}
                  type="password"
                  placeholder="Enter password"
                  style={{ marginBottom: "1.2rem" }}
                />
              </div>
              <div>
                <label
                  className={`form-label ${newEmailStatus ? "form-error-color" : ""} `}
                >
                  New Email
                  {newEmailStatus ? (
                    <span style={{ fontStyle: "italic", fontSize: ".76rem" }}>
                      {" "}
                      - {newEmailStatus}
                    </span>
                  ) : (
                    ""
                  )}
                </label>
                <input
                  ref={newEmailRef}
                  className="form-input change-email-input"
                  onInput={() => setNewEmailStatus(null)}
                  type="text"
                  placeholder="New email"
                />
              </div>
            </div>
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={() => setIsEmailOpen(false)}
                className="change-email-btn change-email-cancel"
              >
                Cancel
              </button>
              <button type="submit" className="change-email-btn">
                {isEmailLoading && (
                  <HorizontalLoader2
                    style={{ position: "absolute" }}
                    size={0.55}
                  />
                )}
                <span style={{ opacity: isEmailLoading ? 0 : 1 }}>Done</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default memo(AccountSettings);
