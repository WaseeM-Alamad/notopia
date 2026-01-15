"use client";
import { signUpAction } from "@/utils/actions";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import React, { useEffect, useRef, useState } from "react";
import isEmail from "validator/lib/isEmail";
import HorizontalLoader2 from "../Tools/HorizontalLoader2";
import CustomThreeLineSpinner from "../Tools/CustomSpinner";

const RightPanel = ({
  isLogin,
  toggleForm,
  googleIsLoading,
  setGoogleIsLoading,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const [emailStatus, setEmailStatus] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [PassStatus, setPassStatus] = useState(null);

  const formRef = useRef(null);
  const emailRef = useRef(null);
  const userRef = useRef(null);
  const passRef = useRef(null);

  useEffect(() => {
    passRef.current.value = "";
    setEmailStatus(null);
    setUserStatus(null);
    setPassStatus(null);
  }, [isLogin]);

  async function handleSignUp(formData) {
    if (isSubmitLoading) return;

    const isEmailValid = validateEmail(null, true);
    const isUserValid = validateUsername(null, true);
    const isPassValid = validatePassword(null, true);

    if (!isUserValid || !isPassValid || !isEmailValid) return;

    setIsSubmitLoading(true);

    const { type, message } = await signUpAction(formData);

    switch (type) {
      case "email":
        setEmailStatus(message);
        break;
      case "username":
        setUserStatus(message);
        break;
      case "password":
        setPassStatus(message);
        break;
    }

    setIsSubmitLoading(false);
  }

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

  const validateUsername = (e, isSubmit) => {
    const val = userRef.current.value.toLowerCase();

    if (!val.trim()) {
      if (isSubmit) {
        setUserStatus("Field can't be empty");
      }
      return false;
    }

    if (val.length < 2) {
      setUserStatus("At least 2 characters");
      return false;
    }

    if (val.length > 20) {
      setUserStatus("At most 20 characters");
      return false;
    }

    if (!/^[a-z0-9._]+$/.test(val)) {
      setUserStatus("Only letters, numbers, underscores, and periods allowed");
      return false;
    }

    if (val.includes("..")) {
      setUserStatus("Cannot contain consecutive periods");
      return false;
    }

    if (/^[._]/.test(val)) {
      setUserStatus("Cannot start with a period or underscore");
      return false;
    }

    if (/[._]$/.test(val)) {
      setUserStatus("Cannot end with a period or underscore");
      return false;
    }

    return true;
  };

  const validateEmail = (e, isSubmit) => {
    const val = emailRef.current.value;
    if (!val.trim()) {
      if (isSubmit) {
        const message = "Field can't be empty";
        setEmailStatus(message);
      }
      return false;
    }

    if (!isEmail(val)) {
      const message = "Invalid email";
      setEmailStatus(message);
      return false;
    }
    return true;
  };

  return (
    <motion.div
      initial={{
        pointerEvents: isLogin ? "none" : "auto",
        x: isLogin ? 40 : 0,
        opacity: isLogin ? 0 : 1,
        // scale: isLogin ? 0.99 : 1,
      }}
      animate={{
        pointerEvents: isLogin ? "none" : "auto",
        x: isLogin ? 40 : 0,
        opacity: isLogin ? 0 : 1,
        // scale: isLogin ? 0.99 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 270,
        damping: 50,
        mass: 3,
        opacity: { duration: 0.35 },
      }}
      className="right-panel"
    >
      <div>
        <div className="form-title">Create Account</div>
      </div>

      <div className="form-container">
        <form
          id="signup-form"
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleSignUp(formData);
          }}
          ref={formRef}
        >
          <div>
            <label
              className={`form-label ${emailStatus ? "form-error-color" : ""} `}
            >
              Email
              {emailStatus ? (
                <span style={{ fontStyle: "italic", fontSize: ".76rem" }}>
                  {" "}
                  - {emailStatus}
                </span>
              ) : (
                ""
              )}
            </label>
            <input
              className="form-input"
              ref={emailRef}
              name="email"
              onInput={() => setEmailStatus(null)}
              onBlur={(e) => validateEmail(e, false)}
              type="text"
              placeholder="Enter your email"
              spellCheck="false"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div>
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
            <input
              className="form-input"
              ref={userRef}
              onInput={(e) => {
                e.target.value = e.target.value.toLowerCase();
                setUserStatus(null);
              }}
              name="username"
              onBlur={(e) => validateUsername(e, false)}
              type="text"
              placeholder="Enter your username"
              autoCorrect="off"
            />
          </div>
          <div>
            <label
              className={`form-label ${PassStatus ? "form-error-color" : ""} `}
            >
              Password
              {PassStatus ? (
                <span style={{ fontStyle: "italic", fontSize: ".76rem" }}>
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
                placeholder="Enter your password"
                onInput={() => setPassStatus(null)}
                onBlur={(e) => {
                  setShowPassword(false);
                  validatePassword(e, false);
                }}
                style={{ paddingRight: "3rem", marginBottom: "0" }}
                spellCheck="false"
                autoComplete="off"
              />
            </div>
          </div>
        </form>
        <div className="form-btns-container">
          <button type="submit" form="signup-form" className="login-btn">
            {!isSubmitLoading ? "Sign Up" : <HorizontalLoader2 size={0.55} />}
          </button>
          <div
            onClick={async () => {
              setGoogleIsLoading(true);
              await signIn("google");
              setTimeout(() => {
                setGoogleIsLoading(false);
              }, 500);
            }}
            className="login-btn border-btn"
          >
            {!googleIsLoading ? (
              <>
                <div className="google-icon" />
                Sign up with Google
              </>
            ) : (
              <CustomThreeLineSpinner
                size={20}
                strokeWidth={3}
                color={
                  document.documentElement.classList.contains("dark-mode")
                    ? "#dfdfdf"
                    : "#292929"
                }
              />
            )}
          </div>
        </div>
        <div className="form-bottom">
          <span className="form-bottom-question">Already have an account?</span>
          <span className="slider-trigger" onClick={toggleForm}>
            {" "}
            Sign In
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default RightPanel;
