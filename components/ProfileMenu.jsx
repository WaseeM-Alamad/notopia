import React, { useEffect, useRef, useState } from "react";
import { Settings, LogoutOutlined, PersonAdd } from "@mui/icons-material";
import Image from "next/image";
import { Avatar, IconButton } from "@mui/material";
import "@/assets/styles/ProfileMenu.css";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from 'framer-motion';

export default function SimpleMenu({ image, name }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpacity, setMenuOpacity] = useState(0);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target)
      )
        setIsOpen(false);
    }
    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMenuOpacity(1);
    } else {
      setMenuOpacity(0);
    }
  }, [isOpen]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <IconButton
        ref={menuButtonRef}
        disableTouchRipple
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "4px",
          border: "none",
          background: "none",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "green",
          },
        }}
      >
        <Image
          draggable={false}
          src={image}
          alt="profile"
          className="profile-image"
          width={35}
          height={35}
        />
      </IconButton>
      <AnimatePresence> 
      {isOpen && (
        <motion.div
          className="menu"
          ref={menuRef}
          initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
        >
          <div className="menu-banner">
            <Image
              style={{ margin: "auto", marginTop: "3px", borderRadius: "50%" }}
              draggable={false}
              src={image}
              alt="profile"
              width={46}
              height={46}
            />
            <p> {name} </p>
          </div>
          <MenuItem
            icon={<Avatar sx={{ width: "32px", height: "32px" }} />}
            text="Profile"
          />
          <MenuItem
            icon={<Avatar sx={{ width: "32px", height: "32px" }} />}
            text="My account"
          />
          <Divider />
          <MenuItem
            icon={<PersonAdd sx={{ width: "20px", height: "20px" }} />}
            text="Add another account"
          />
          <MenuItem
            icon={<Settings sx={{ width: "20px", height: "20px" }} />}
            text="Settings"
          />
          <MenuItem
            onClick={() => signOut()}
            icon={<LogoutOutlined sx={{ width: "20px", height: "20px" }} />}
            text="Logout"
          />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

const MenuItem = ({ icon, text, onClick }) => (
  <button className="btn" onClick={onClick}>
    <span style={{ opacity: 0.7, display: "flex" }}>{icon}</span>
    {text}
  </button>
);

const Divider = () => (
  <div
    style={{
      height: "1px",
      backgroundColor: "#e0e0e0",
      margin: "8px 0",
    }}
  />
);
