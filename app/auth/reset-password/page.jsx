"use client";

import Modal from "@/components/Tools/Modal";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const Page = () => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [PassStatus, setPassStatus] = useState(null);

  const cancelReset = () => {
    router.push("/auth/login");
  };

  return (
    <>
      <Modal>
        <motion.div
          initial={{
            scale: 0.9,
            opacity: 0,
          }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 50, mass: 1 }}
          className="reset-pass-container"
        >
          <div className="reset-pass">
            <div className="form-title">Reset Password</div>
            <div className="form-container">
              <form className="login-form">
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
                <div>
                  <label
                    className={`form-label ${PassStatus ? "form-error-color" : ""} `}
                  >
                    Confirm Password
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
                      name="confirm-password"
                      type={showPassword ? "text" : "password"}
                      onInput={() => setPassStatus(null)}
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
              <button className="login-btn">Reset Password</button>
              <button onClick={cancelReset} className="login-btn border-btn">
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </Modal>
    </>
  );
};

export default Page;
