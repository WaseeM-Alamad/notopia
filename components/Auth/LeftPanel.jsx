import { CircularProgress } from "@mui/material";
import { Box } from "@mui/system";
import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import isEmail from "validator/lib/isEmail";
import Modal from "../Tools/Modal";
import { sendResetPassAction } from "@/utils/actions";

const LeftPanel = ({
  isLogin,
  toggleForm,
  googleIsLoading,
  setGoogleIsLoading,
}) => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [PassStatus, setPassStatus] = useState(null);
  const [modalOpen, setModalOpen] = useState(true);
  const [isForgotloading, setIsForgotLoading] = useState(false);

  const formRef = useRef(null);

  const emailRef = useRef(null);
  const passRef = useRef(null);

  useEffect(() => {
    passRef.current.value = "";
    setEmailStatus(null);
    setPassStatus(null);
  }, [isLogin]);

  const validateEmail = (e, isSubmit) => {
    const val = emailRef.current.value;
    if (!val.trim()) {
      isSubmit && setEmailStatus("Field can't be empty");
      return false;
    }

    if (!isEmail(val)) {
      setEmailStatus("Invalid email");
      return false;
    }
    return true;
  };

  async function handleLogin(event) {
    event.preventDefault();
    if (isSubmitLoading) return;

    const isEmailValid = validateEmail(null, true);
    const isPasswordValid = passRef?.current.value.trim().length > 0;

    if (passRef?.current.value.trim().length === 0) {
      setPassStatus("Field can't be empty");
    }

    if (!isEmailValid || !isPasswordValid) return;

    setEmailStatus(null);
    setPassStatus(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    setIsSubmitLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res.ok) {
      router.push("/main");
    } else {
      const { type, message } = JSON.parse(res.error);
      switch (type) {
        case "both": {
          setEmailStatus(message);
          setPassStatus(message);
          break;
        }
        case "email": {
          setEmailStatus(message);
          break;
        }
        case "password": {
          setPassStatus(message);
          break;
        }
      }
      setIsSubmitLoading(false);
    }
  }

  const handleForgotPass = async () => {
    const isEmailValid = validateEmail(null, true);
    if (!isEmailValid) return;

    setIsForgotLoading(true);

    const email = emailRef.current?.value?.trim();
    const { success, message } = await sendResetPassAction(email);

    if (success) {
      setModalOpen(isEmailValid);
    } else {
      setEmailStatus(message);
    }

    setIsForgotLoading(false);
  };

  return (
    <>
      <motion.div
        initial={{
          x: !isLogin ? -40 : 0,
          opacity: !isLogin ? 0 : 1,
          // scale: !isLogin ? 0.99 : 1,
        }}
        animate={{
          x: !isLogin ? -40 : 0,
          opacity: !isLogin ? 0 : 1,
          // scale: !isLogin ? 0.99 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 270,
          damping: 50,
          mass: 3,
          opacity: { duration: 0.35 },
        }}
        className="left-panel"
      >
        <div>
          <div className="form-title">Sign in</div>
        </div>

        <div className="form-container">
          <form
            id="signin-form"
            ref={formRef}
            onSubmit={handleLogin}
            className="login-form"
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
                type="text"
                onInput={() => setEmailStatus(null)}
                onBlur={() => validateEmail(null, false)}
                placeholder="Enter your email"
                spellCheck="false"
                autoCapitalize="none"
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
                  onInput={() => setPassStatus(null)}
                  onBlur={() => setShowPassword(false)}
                  placeholder="Enter your password"
                  style={{ paddingRight: "3rem", marginBottom: "0" }}
                  spellCheck="false"
                  autoComplete="off"
                />
              </div>
            </div>
          </form>
          <div className="form-tools">
            <div onClick={handleForgotPass} className="forgot-pass">
              {!isForgotloading ? "Forgot password?" : "Please wait..."}
            </div>
          </div>
          <div className="form-btns-container">
            <button form="signin-form" type="submit" className="login-btn">
              {!isSubmitLoading ? (
                "Sign In"
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
                  Sign in with Google
                </>
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
            </div>
          </div>
          <div className="form-bottom">
            <span className="form-bottom-question">Don't have an account?</span>
            <span className="slider-trigger" onClick={toggleForm}>
              {" "}
              Sign Up
            </span>
          </div>
        </div>
      </motion.div>
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
        className="instructions-container"
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        overlay={true}
      >
        <div className="instructions-dialog">
          <div
            style={{
              fontSize: "1.3rem",
              fontWeight: "550",
              marginBottom: "1rem",
            }}
          >
            Instructions sent!
          </div>
          <div style={{ fontWeight: "500", lineHeight: "1.4rem" }}>
            We sent instructions to change your password to{" "}
            <span style={{ fontWeight: "bold" }}>
              {emailRef?.current?.value}
            </span>
            , please check both your inbox and spam folder.
          </div>
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div className="okay-btn" onClick={() => setModalOpen(false)}>
              Okay
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LeftPanel;
