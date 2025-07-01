import { CircularProgress } from "@mui/material";
import { Box } from "@mui/system";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import isEmail from "validator/lib/isEmail";

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

  const formRef = useRef(null);

  const emailRef = useRef(null);
  const passRef = useRef(null);

  useEffect(() => {
    passRef.current.value = "";
    setEmailStatus(null);
    setPassStatus(null);
  }, [isLogin]);

  const validateEmail = () => {
    const val = emailRef.current.value;
    if (!val.trim()) {
      setEmailStatus("Field can't be empty");
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

    const isEmailValid = validateEmail();
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

  const handleForgotPass = () => {
    const emailVal = emailRef.current.value.trim();
    if (emailVal) {
    } else {
      setEmailStatus("Please enter email");
    }
  };

  return (
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
            Forgot password?
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
  );
};

export default LeftPanel;
