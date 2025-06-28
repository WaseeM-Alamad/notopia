import React, { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "@/assets/styles/modal.css";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../Tools/Button";
import MoreMenu from "./MoreMenu";
import ImageMenu from "./ImageMenu";

const AccountSettings = ({ settingsRef, setIsOpen, user }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [disabledInput, setDisabledInput] = useState({
    email: true,
    name: true,
  });
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const imageRef = useRef(null);
  const emailRef = useRef(null);
  const nameRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const menuItems = [
    {
      title: "Change Image",
      function: () => {},
    },
    {
      title: "Remove Image",
      function: () => {},
    },
  ];

  if (!isMounted) return;

  return createPortal(
    <>
      <motion.div
        ref={containerRef}
        className="overlay"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
          pointerEvents: "none",
          display: "none",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 50,
          mass: 1,
        }}
        onClick={(e) => {
          if (e.target === containerRef.current) setIsOpen(false);
        }}
      />
      <motion.div
        ref={settingsRef}
        initial={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        animate={{
          transform: "translate(-50%, -40%) scale(1)",
          opacity: 1,
        }}
        exit={{
          transform: "translate(-50%, -40%) scale(0.97)",
          opacity: 0,
        }}
        transition={{ type: "spring", stiffness: 700, damping: 50, mass: 1 }}
        className="settings-modal"
      >
        <Button
          onClick={() => setIsOpen(false)}
          className="clear-icon acc-close-icon"
        />
        <div className="acc-top">
          <div className="acc-header">
            <div>Account Settings</div>
            <div className="update-info"> Update your account information </div>
          </div>
          <div
            ref={imageRef}
            onClick={() => setImageMenuOpen((prev) => !prev)}
            className="acc-img"
            style={{ pointerEvents: imageMenuOpen && "none" }}
          >
            <div className="acc-img-hv" />
            <img src={user.image} />
          </div>
        </div>

        <div className="acc-inputs-container">
          <div style={{ width: "100%", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label> Email </label>
              <div
                onClick={() => {
                  setDisabledInput((prev) => ({ ...prev, email: false }));
                  requestAnimationFrame(() => {
                    emailRef.current.focus();
                  });
                }}
                className="acc-edit"
              >
                Edit
              </div>
            </div>
            <input
              ref={emailRef}
              disabled={disabledInput.email}
              autoCorrect="false"
              defaultValue={user.email}
            />
          </div>

          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label> Username </label>
              <div
                onClick={() => {
                  setDisabledInput((prev) => ({ ...prev, name: false }));
                  requestAnimationFrame(() => {
                    nameRef.current.focus();
                  });
                }}
                className="acc-edit"
              >
                Edit
              </div>
            </div>
            <input
              ref={nameRef}
              disabled={disabledInput.name}
              autoCorrect="false"
              defaultValue={user.name}
            />
          </div>

          <div style={{ width: "100%" }}>
            <label> Password </label>
            <input
              style={{ cursor: "not-allowed", opacity: "0.7" }}
              disabled
              autoCorrect="false"
              value="••••••••"
            />
          </div>
        </div>

        <div>
          <button disabled className="acc-btn">
            Save Changes
          </button>
        </div>
      </motion.div>
      <AnimatePresence>
        {imageMenuOpen && (
          <ImageMenu
            setIsOpen={setImageMenuOpen}
            anchorEl={imageRef.current}
            isOpen={imageMenuOpen}
            menuItems={menuItems}
          />
        )}
      </AnimatePresence>
    </>,
    document.getElementById("modal-portal")
  );
};

export default memo(AccountSettings);
