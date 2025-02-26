import { motion } from "framer-motion";
import React, { memo, useEffect, useState } from "react";

const addButton = ({ onClick, ref }) => {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    setCurrentHash(window.location.hash);

    const handler = (e) => {
      const hash = window.location.hash;
      setCurrentHash(hash);
    };

    window.addEventListener("hashchange", handler);

    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="45"
      height="45"
      className="add-button-icon pulse-button"
      viewBox="0 0 45 45"
      fill="none"
    >
      <circle cx="22.5" cy="22.5" r="22.5" className="add-circle-fill" />
      <g filter="url(#filter0_d_419_13)">
        <motion.path
          initial={{ x: currentHash.includes("trash") ? 40 : 0 }}
          animate={{
            x: currentHash.includes("trash") ? 40 : 0,
            displax: currentHash.includes("trash") ? "none" : "",
          }}
          transition={{
            x: { type: "spring", stiffness: 700, damping: 50, mass: 1 },
            opacitx: { duration: 0.2 },
          }}
          d="M31.6875 21.1875H23.8125V13.3125C23.8125 12.9644 23.6742 12.6306 23.4281 12.3844C23.1819 12.1383 22.8481 12 22.5 12C22.1519 12 21.8181 12.1383 21.5719 12.3844C21.3258 12.6306 21.1875 12.9644 21.1875 13.3125V21.1875H13.3125C12.9644 21.1875 12.6306 21.3258 12.3844 21.5719C12.1383 21.8181 12 22.1519 12 22.5C12 22.8481 12.1383 23.1819 12.3844 23.4281C12.6306 23.6742 12.9644 23.8125 13.3125 23.8125H21.1875V31.6875C21.1875 32.0356 21.3258 32.3694 21.5719 32.6156C21.8181 32.8617 22.1519 33 22.5 33C22.8481 33 23.1819 32.8617 23.4281 32.6156C23.6742 32.3694 23.8125 32.0356 23.8125 31.6875V23.8125H31.6875C32.0356 23.8125 32.3694 23.6742 32.6156 23.4281C32.8617 23.1819 33 22.8481 33 22.5C33 22.1519 32.8617 21.8181 32.6156 21.5719C32.3694 21.3258 32.0356 21.1875 31.6875 21.1875Z"
          className="add-btn-fill"
        />
      </g>
      <motion.path
        initial={{ x: !currentHash.includes("trash") ? -40 : 0 }}
        animate={{
          x: !currentHash.includes("trash") ? -40 : 0,
          displax: !currentHash.includes("trash") ? "none" : "",
        }}
        transition={{
          x: { type: "spring", stiffness: 700, damping: 50, mass: 1 },
          opacitx: { duration: 0.2 },
        }}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.3267 12C18.8309 12 17.6128 13.1578 17.5658 14.6033H14.9802C14.4388 14.6033 14 15.0307 14 15.5579C14 16.0568 14.3931 16.4663 14.8941 16.5088L15.6007 30.4426C15.6733 31.875 16.887 33 18.3597 33H27.6426C29.1138 33 30.3268 31.8772 30.4015 30.4464L31.1076 16.9079C31.1149 16.7684 31.091 16.6343 31.0419 16.5122C31.5731 16.5007 32 16.0778 32 15.5579C32 15.0307 31.5612 14.6033 31.0198 14.6033H28.4342C28.3872 13.1578 27.1691 12 25.6733 12H20.3267ZM20.3267 13.9091C19.9139 13.9091 19.574 14.2128 19.5296 14.6033H26.4704C26.426 14.2128 26.0861 13.9091 25.6733 13.9091H20.3267ZM29.2153 16.5124H16.857L17.5587 30.3484C17.5798 30.7643 17.9321 31.0909 18.3597 31.0909H27.6426C28.0698 31.0909 28.4219 30.7649 28.4436 30.3495L29.1497 16.8111C29.1552 16.7058 29.178 16.6055 29.2153 16.5124Z"
        className="add-btn-fill"
      />
      <motion.path
        initial={{ x: !currentHash.includes("trash") ? -40 : 0 }}
        animate={{
          x: !currentHash.includes("trash") ? -40 : 0,
          displax: !currentHash.includes("trash") ? "none" : "",
        }}
        transition={{
          x: { type: "spring", stiffness: 700, damping: 50, mass: 1 },
          opacitx: { duration: 0.2 },
        }}
        d="M21.2527 20.6971C20.8231 20.2675 20.1266 20.2675 19.697 20.6971C19.2675 21.1266 19.2675 21.8231 19.697 22.2527L21.3941 23.9497L19.697 25.6468C19.2675 26.0764 19.2675 26.7729 19.697 27.2024C20.1266 27.632 20.8231 27.632 21.2527 27.2024L22.9497 25.5054L24.6468 27.2024C25.0764 27.632 25.7728 27.632 26.2024 27.2024C26.632 26.7729 26.632 26.0764 26.2024 25.6468L24.5054 23.9497L26.2024 22.2527C26.632 21.8231 26.632 21.1266 26.2024 20.6971C25.7728 20.2675 25.0764 20.2675 24.6468 20.6971L22.9497 22.3941L21.2527 20.6971Z"
        className="add-btn-fill"
      />
    </svg>
  );
};

export default memo(addButton);
