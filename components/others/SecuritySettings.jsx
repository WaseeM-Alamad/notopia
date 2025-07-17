import React, { memo, useEffect, useRef, useState } from "react";
import HorizontalLoader2 from "../Tools/HorizontalLoader2";
import { AnimatePresence, motion } from "framer-motion";
import { updatePasswordAction } from "@/utils/actions";
import { useAppContext } from "@/context/AppContext";

const SecuritySettings = ({ rightHeader, selected }) => {
  const { openSnackRef } = useAppContext();
  const [reRender, triggerRerender] = useState(false);
  const [currentPassStatus, setCurrentPassStatus] = useState(null);
  const [newPassStatus, setNewPassStatus] = useState(null);
  const [confirmNewPassStatus, setConfirmNewPassStatus] = useState(null);
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  const formRef = useRef(null);
  const currentPassRef = useRef(null);
  const newPassRef = useRef(null);
  const confirmNewPassRef = useRef(null);

  const disableSave =
    !currentPassRef?.current?.value ||
    !newPassRef?.current?.value ||
    !confirmNewPassRef?.current?.value;

  useEffect(() => {
    reset();
  }, [selected]);

  const reset = () => {
    formRef.current.reset();
    setCurrentPassStatus(null);
    setNewPassStatus(null);
    setConfirmNewPassStatus(null);
    triggerRerender();
  };

  const validateCurrentPassword = () => {
    const val = currentPassRef.current.value;
    if (!val.trim()) {
      const message = "Field can't be empty";
      setCurrentPassStatus(message);
      return false;
    }
    return true;
  };

  const validateNewPassword = () => {
    const val = newPassRef.current.value;
    if (!val.trim()) {
      const message = "Field can't be empty";
      setNewPassStatus(message);
      return false;
    }

    if (val.length < 8) {
      const message = "At least 8 characters";
      setNewPassStatus(message);
      return false;
    }
    if (val.trim() && val.trim() !== val) {
      const message = "Can't contain spaces at start or end";
      setNewPassStatus(message);
      return false;
    }
    if (!/[a-z]/.test(val)) {
      const message = "At least one lowercase letter";
      setNewPassStatus(message);
      return false;
    }
    if (!/[A-Z]/.test(val)) {
      const message = "At least one uppercase letter";
      setNewPassStatus(message);
      return false;
    }
    if (!/[0-9]/.test(val)) {
      const message = "At least one number";
      setNewPassStatus(message);
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(val)) {
      const message = "At least one symbol";
      setNewPassStatus(message);
      return false;
    }
    return true;
  };

  const validateConfirmNewPassword = () => {
    const val = confirmNewPassRef.current.value;
    if (!val.trim()) {
      const message = "Field can't be empty";
      setConfirmNewPassStatus(message);
      return false;
    }

    if (val !== newPassRef.current.value && val.trim()) {
      const message = "Passwords do not match";
      setConfirmNewPassStatus(message);
      return false;
    }
    return true;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setCurrentPassStatus(null);
    setNewPassStatus(null);
    setConfirmNewPassStatus(null);

    if (newPassRef.current.value === currentPassRef.current.value) {
      setNewPassStatus(
        "New password cannot be the same as your current password"
      );
      return;
    }

    const isCurrentValid = validateCurrentPassword();
    const isNewPassValid = validateNewPassword();
    const isConfirmNewPassValid = validateConfirmNewPassword();

    if (!isCurrentValid || !isNewPassValid || !isConfirmNewPassValid) return;
    const payload = {
      currentPass: currentPassRef.current.value,
      newPass: newPassRef.current.value,
      confirmNewPass: confirmNewPassRef.current.value,
    };
    setIsSaveLoading(true);
    const { success, type, message } = await updatePasswordAction(payload);
    setIsSaveLoading(false);

    if (!success) {
      switch (type) {
        case "current":
          setCurrentPassStatus(message);
          break;
        case "new":
          setNewPassStatus(message);
          break;
        case "confirm":
          setConfirmNewPassStatus(message);
          break;
        default:
          break;
      }
      return;
    }
    openSnackRef.current({
      snackMessage: "Password has been successfully updated!",
      showUndo: false,
    });
    reset();
  };

  return (
    <div style={{ display: !selected && "none" }} className="setting-wrapper">
      <div className="settings-right-title">{rightHeader().title}</div>
      <div className="settings-right-desc">{rightHeader().desc}</div>
      <form id="change-pass-form" onSubmit={handleChangePassword} ref={formRef}>
        <div className="settings-security">
          <div>
            <label
              className={`form-label ${currentPassStatus ? "form-error-color" : ""} `}
            >
              Current Password
              {currentPassStatus ? (
                <span style={{ fontStyle: "italic", fontSize: ".76rem" }}>
                  {" "}
                  - {currentPassStatus}
                </span>
              ) : (
                ""
              )}
            </label>
            <input
              ref={currentPassRef}
              placeholder="Enter current password"
              name="current-password"
              onInput={() => {
                setCurrentPassStatus(null);
                triggerRerender((prev) => !prev);
              }}
              type="password"
              className="form-input"
            />
          </div>
          <div>
            <label
              className={`form-label ${newPassStatus ? "form-error-color" : ""} `}
            >
              New Password
              {newPassStatus ? (
                <span style={{ fontStyle: "italic", fontSize: ".76rem" }}>
                  {" "}
                  - {newPassStatus}
                </span>
              ) : (
                ""
              )}
            </label>
            <input
              ref={newPassRef}
              placeholder="Enter new password"
              name="new-password"
              onInput={() => {
                setNewPassStatus(null);
                triggerRerender((prev) => !prev);
              }}
              type="password"
              className="form-input"
            />
          </div>
          <div>
            <label
              className={`form-label ${confirmNewPassStatus ? "form-error-color" : ""} `}
            >
              Confirm New Password
              {confirmNewPassStatus ? (
                <span style={{ fontStyle: "italic", fontSize: ".76rem" }}>
                  {" "}
                  - {confirmNewPassStatus}
                </span>
              ) : (
                ""
              )}
            </label>
            <input
              ref={confirmNewPassRef}
              placeholder="Confirm new password"
              name="confirm-current-password"
              onInput={() => {
                setConfirmNewPassStatus(null);
                triggerRerender((prev) => !prev);
              }}
              type="password"
              className="form-input"
            />
          </div>
        </div>
      </form>
      <div style={{ marginTop: "1.5rem" }} className="form-input-desc">
        Password should be at least 8 characters long and include a mix of
        letters, numbers, and symbols.
      </div>
      <AnimatePresence>
        {!disableSave && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0, pointerEvents: "none" }}
            transition={{
              type: "spring",
              stiffness: 700,
              damping: 60,
              mass: 1.5,
              opacity: { duration: 0.2 },
            }}
            className="settings-bottom-btns"
          >
            <button
              type="button"
              onClick={reset}
              className="settings-bottom-btn settings-reset-btn"
            >
              Reset
            </button>
            <button
              type="submit"
              form="change-pass-form"
              className="settings-bottom-btn"
            >
              {isSaveLoading && (
                <HorizontalLoader2
                  style={{ position: "absolute" }}
                  size={0.55}
                />
              )}
              <span style={{ opacity: isSaveLoading ? 0 : 1 }}>
                Save Changes
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(SecuritySettings);
