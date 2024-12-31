"use client";
import { useSession, signIn } from "next-auth/react";
import { redirect } from "next/navigation";
import "@/assets/styles/login.css";
import {
  EmailOutlined,
  FacebookOutlined,
  Google,
  WestOutlined,
} from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import CheckMarkForm from "@/components/icons/CheckMarkForm";
import { authOptions } from "@/utils/authOptions";

export default function Page() {
  const [emailClick, setEmailClick] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const checkBoxRef = useRef(null);

  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "authenticated") {
      redirect("/app");
    }
  }, [status]);

  return (
    <>
      {status !== "authenticated" && (
        <div className="container">
          <div className="box">
            <div className="left-container">
              <div className="left-inner">
                <div className="sign-in-options">
                  <h3 className="roboto-regular sign-in-text">Sign In </h3>
                  <motion.div
                    animate={{
                      opacity: emailClick ? 0 : 1,
                      x: emailClick ? 400 : 0,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "circInOut",
                      opacity: { duration: 0.2, ease: "easeInOut" },
                    }}
                    className="options"
                  >
                    <button
                      onClick={() => {
                        signIn("google");
                      }}
                      className="option"
                    >
                      <span className="option-item">
                        <Google />
                        Sign in with Google
                      </span>
                    </button>
                    <button className="option">
                      <span className="option-item">
                        <FacebookOutlined />
                        Sign in with Facebook
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setEmailClick(true);
                      }}
                      className="option"
                    >
                      <span className="option-item">
                        <EmailOutlined />
                        Sign in with Email
                      </span>
                    </button>
                  </motion.div>
                  <motion.div
                    animate={{
                      opacity: !emailClick ? 0 : 1,
                      x: !emailClick ? 0 : 450,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "circInOut",
                      opacity: { duration: 0.4, ease: "easeInOut" },
                    }}
                    className="sign-in-form"
                  >
                    <button
                      onClick={() => {
                        setEmailClick(false);
                      }}
                      className="back-button"
                    >
                      <WestOutlined sx={{ width: "22px", height: "22px" }} />{" "}
                      Back
                    </button>
                    <form>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Email"
                        required
                      />
                      <input
                        type="password"
                        className="form-input form-password"
                        placeholder="Password"
                        required
                      />
                      <button className="form-button">Sign In</button>
                      <input
                        ref={checkBoxRef}
                        style={{ display: "none" }}
                        type="checkbox"
                        onChange={() => {
                          const status = checkBoxRef.current.checked;
                          setIsChecked(status);
                        }}
                      />
                    </form>
                    <div
                      style={{
                        display: "flex",
                        marginTop: "1.6rem",
                      }}
                    >
                      <button
                        onClick={() => {
                          checkBoxRef.current?.click();
                        }}
                        style={{
                          display: "flex",
                          width: "fit-content",
                          alignItems: "center",
                          border: "none",
                          backgroundColor: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            backgroundColor: isChecked ? "#f6586a" : "#e5e5e5",
                            height: "20px",
                            width: "20px",
                            border: "none",
                            borderRadius: "5px",
                            transition: "background-color 0.2s ease",
                          }}
                        >
                          <CheckMarkForm
                            style={{
                              margin: "auto",
                              fill: "white",
                              opacity: isChecked ? "1" : "0",
                              transition: "opacity 0.2s ease",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            marginLeft: "0.8rem",
                            color: isChecked ? "#f6586a" : "#f4abb2",
                            fontSize: "0.94rem",
                            height: "fit-content",
                            position: "relative",
                            top: "1px",
                            transition: "color 0.2s ease",
                          }}
                        >
                          Remember Me
                        </span>
                      </button>
                      <span className="forgot-button">Forgot Password </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
            <div className="right-container">
              <motion.div
                initial={{ y: 150, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  y: {
                    duration: 0.5,
                    type: "spring", // Use spring animation for y
                    stiffness: 250, // Controls the spring's strength (higher = more stiff)
                    damping: 30, // Controls the bounciness (higher = less bouncy)
                    mass: 1, // Mass of the object (affects how fast it moves)
                  },
                  opacity: { duration: 0.5 },
                }}
                className="right-inner"
              >
                <h1 style={{ paddingBottom: "1rem", fontWeight: "900" }}>
                  Welcome to Notopia
                </h1>
                <h4 style={{ fontWeight: "200", paddingBottom: "1rem" }}>
                  Don't have an account?
                </h4>
                <button className="sign-up-button">
                  {" "}
                  <span>Sign Up</span>{" "}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
