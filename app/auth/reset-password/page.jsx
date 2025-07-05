"use client";

import HorizontalLoader from "@/components/Tools/horizontalLoader";
import Modal from "@/components/Tools/Modal";
import { resetPasswordAction, verifyResetTokenAction } from "@/utils/actions";
import { CircularProgress } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const Page = () => {
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [PassStatus, setPassStatus] = useState(null);
  const [confirmPassStatus, setConfirmPassStatus] = useState(null);
  const [isValidLoading, setIsValidLoading] = useState(true);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [validToken, setValidToken] = useState(null);
  const [PasswordReset, setPasswordReset] = useState(false);

  const passRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setIsFormValid(false);
      setIsValidLoading(false);
      return;
    }

    const verifyToken = async () => {
      const { success } = await verifyResetTokenAction(token);
      success && setValidToken(token);
      setTimeout(() => {
        setIsFormValid(success);
        setIsValidLoading(false);
      }, 500);
    };

    verifyToken();
  }, []);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    const isPassValid = validatePassword(null, true);
    const isConfirmValid = validateConfirmPassword(null, true);
    if (!isPassValid || !isConfirmValid || !validToken) return;
    setIsResetLoading(true);
    const formData = new FormData(event.currentTarget);
    const { success, passExists } = await resetPasswordAction(
      formData,
      validToken
    );

    if (passExists) {
      setPassStatus("New password can’t be the same as your current one");
    } else {
      setPasswordReset(success);
      setIsFormValid(false);
    }
    setIsResetLoading(false);
  };

  const cancelReset = () => {
    setIsCancelLoading(true);
    router.push("/auth/login");
  };

  const validateConfirmPassword = (e, isSubmit) => {
    const val = confirmRef.current.value;
    if (!val.trim()) {
      if (isSubmit) {
        const message = "Field can't be empty";
        setConfirmPassStatus(message);
      }
      return false;
    }

    if (val !== passRef.current.value && val.trim()) {
      const message = "Passwords do not match";
      setConfirmPassStatus(message);
      return false;
    }
    setConfirmPassStatus(null);
    return true;
  };

  const validatePassword = (e, isSubmit = false) => {
    const val = passRef.current.value;
    if (!val.trim()) {
      if (isSubmit) {
        const message = "Field can't be empty";
        setPassStatus(message);
      }
      return false;
    }

    if (val.length < 8) {
      const message = "At least 8 characters";
      setPassStatus(message);
      return false;
    }
    if (val.trim() && val.trim() !== val) {
      const message = "Can't contain spaces at start or end";
      setPassStatus(message);
      return false;
    }
    if (!/[a-z]/.test(val)) {
      const message = "At least one lowercase letter";
      setPassStatus(message);
      return false;
    }
    if (!/[A-Z]/.test(val)) {
      const message = "At least one uppercase letter";
      setPassStatus(message);
      return false;
    }
    if (!/[0-9]/.test(val)) {
      const message = "At least one number";
      setPassStatus(message);
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(val)) {
      const message = "At least one symbol";
      setPassStatus(message);
      return false;
    }
    return true;
  };

  if (!isClient) return;

  return (
    <>
      {isFormValid ? (
        <AnimatePresence>
          <Modal
            initial={{
              scale: 0.9,
              opacity: 0,
            }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{
              scale: 0.9,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 50,
              mass: 1,
            }}
            isOpen={true}
            className="reset-pass-container"
          >
            <div className="reset-pass">
              <div className="form-title">Reset Password</div>
              <div className="form-container">
                <form
                  onSubmit={handleResetPassword}
                  id="reset-form"
                  className="login-form"
                >
                  <div>
                    <label
                      className={`form-label ${PassStatus ? "form-error-color" : ""} `}
                    >
                      Password
                      {PassStatus ? (
                        <span
                          style={{ fontStyle: "italic", fontSize: ".76rem" }}
                        >
                          {" "}
                          - {PassStatus}
                        </span>
                      ) : (
                        ""
                      )}
                    </label>
                    <div
                      style={{
                        position: "relative",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        onClick={() => setShowPassword((prev) => !prev)}
                        className={`show-pass-icon ${!showPassword ? "hide-pass-icon" : ""}`}
                      />
                      <input
                        className="form-input"
                        ref={passRef}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        onInput={() => setPassStatus(null)}
                        onBlur={() => {
                          setShowPassword(false);
                          validatePassword(null, false);
                        }}
                        placeholder="Enter your password"
                        style={{ paddingRight: "3rem", marginBottom: "0" }}
                        spellCheck="false"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className={`form-label ${confirmPassStatus ? "form-error-color" : ""} `}
                    >
                      Confirm Password
                      {confirmPassStatus ? (
                        <span
                          style={{ fontStyle: "italic", fontSize: ".76rem" }}
                        >
                          {" "}
                          - {confirmPassStatus}
                        </span>
                      ) : (
                        ""
                      )}
                    </label>
                    <div
                      style={{
                        position: "relative",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className={`show-pass-icon ${!showConfirmPassword ? "hide-pass-icon" : ""}`}
                      />
                      <input
                        className="form-input"
                        name="confirm-password"
                        ref={confirmRef}
                        type={showConfirmPassword ? "text" : "password"}
                        onInput={() => setConfirmPassStatus(null)}
                        onBlur={() => {
                          setShowConfirmPassword(false);
                          validateConfirmPassword(null);
                        }}
                        placeholder="Confirm your password"
                        style={{ paddingRight: "3rem", marginBottom: "0" }}
                        spellCheck="false"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div style={{ marginTop: "0" }} className="form-btns-container">
                <button type="submit" form="reset-form" className="login-btn">
                  {!isResetLoading ? (
                    "Reset Password"
                  ) : (
                    <CircularProgress
                      sx={{
                        color: document.documentElement.classList.contains(
                          "dark-mode"
                        )
                          ? " #292929"
                          : "#dfdfdf",
                      }}
                      size={20}
                      thickness={5}
                    />
                  )}
                </button>
                <button onClick={cancelReset} className="login-btn border-btn">
                  {!isCancelLoading ? (
                    "Cancel"
                  ) : (
                    <CircularProgress
                      sx={{
                        color: document.documentElement.classList.contains(
                          "dark-mode"
                        )
                          ? "#dfdfdf"
                          : "rgb(110, 110, 110)",
                      }}
                      size={20}
                      thickness={5}
                    />
                  )}
                </button>
              </div>
            </div>
          </Modal>
        </AnimatePresence>
      ) : (
        <AnimatePresence>
          <Modal
            initial={{
              scale: 0.9,
              opacity: 0,
            }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{
              scale: 0.9,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 50,
              mass: 1,
            }}
            isOpen={true}
            className="verify-acc-container"
            style={
              isValidLoading && !PasswordReset
                ? { maxWidth: "400px", maxHeight: "250px" }
                : undefined
            }
          >
            <div className="verify-acc">
              <div
                style={
                  isValidLoading || PasswordReset
                    ? {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: PasswordReset ? "" : "center",
                        height: "100%",
                        gap: "1rem",
                        marginBottom: PasswordReset ? "0" : "3rem",
                      }
                    : undefined
                }
              >
                <div
                  style={{
                    fontSize: !isValidLoading ? "1.5rem" : "1.7rem",
                    marginBottom: "0.4rem",
                  }}
                >
                  {!PasswordReset
                    ? !isValidLoading
                      ? "Reset link has expired"
                      : "Please wait..."
                    : "Password has been updated!"}
                </div>
                {isValidLoading && !PasswordReset ? (
                  <HorizontalLoader color="#2b2663" size={0.8} />
                ) : (
                  !PasswordReset && (
                    <div style={{ fontSize: "1rem" }}>
                      Please request another link
                    </div>
                  )
                )}
                {PasswordReset && (
                  <div
                    onClick={cancelReset}
                    className="login-btn"
                    style={{ marginTop: "auto" }}
                  >
                    {!isCancelLoading ? (
                      "Sign in"
                    ) : (
                      <CircularProgress
                        sx={{
                          color: document.documentElement.classList.contains(
                            "dark-mode"
                          )
                            ? " #292929"
                            : "#dfdfdf",
                        }}
                        size={20}
                        thickness={5}
                      />
                    )}
                  </div>
                )}
              </div>
              {!isValidLoading && !PasswordReset && (
                <div
                  onClick={() => {
                    setIsCancelLoading(true);
                    router.push("/auth/login");
                  }}
                  style={{ marginTop: "auto" }}
                  className="login-btn"
                >
                  {!isCancelLoading ? (
                    "Back"
                  ) : (
                    <CircularProgress
                      sx={{
                        color: document.documentElement.classList.contains(
                          "dark-mode"
                        )
                          ? " #292929"
                          : "#dfdfdf",
                      }}
                      size={20}
                      thickness={5}
                    />
                  )}
                </div>
              )}
            </div>
          </Modal>
        </AnimatePresence>
      )}
    </>
  );
};

export default Page;
