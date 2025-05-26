import { motion } from "framer-motion";
import React, { memo, useEffect, useState } from "react";

const AddButton = () => {
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
          initial={{
            rotate: currentHash.includes("trash") ? 45 : 0,
            scale: currentHash.includes("trash") ? 0.5 : 1,
            strokeWidth: currentHash.includes("trash") ? .8 : 0,
          }}
          animate={{
            rotate: currentHash.includes("trash") ? 45 : 0,
            scale: currentHash.includes("trash") ? 0.5 : 1,
            strokeWidth: currentHash.includes("trash") ? .8 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 600,
            damping: 50,
            mass: 1,
          }}
          d="M31.6875 21.1875H23.8125V13.3125C23.8125 12.9644 23.6742 12.6306 23.4281 12.3844C23.1819 12.1383 22.8481 12 22.5 12C22.1519 12 21.8181 12.1383 21.5719 12.3844C21.3258 12.6306 21.1875 12.9644 21.1875 13.3125V21.1875H13.3125C12.9644 21.1875 12.6306 21.3258 12.3844 21.5719C12.1383 21.8181 12 22.1519 12 22.5C12 22.8481 12.1383 23.1819 12.3844 23.4281C12.6306 23.6742 12.9644 23.8125 13.3125 23.8125H21.1875V31.6875C21.1875 32.0356 21.3258 32.3694 21.5719 32.6156C21.8181 32.8617 22.1519 33 22.5 33C22.8481 33 23.1819 32.8617 23.4281 32.6156C23.6742 32.3694 23.8125 32.0356 23.8125 31.6875V23.8125H31.6875C32.0356 23.8125 32.3694 23.6742 32.6156 23.4281C32.8617 23.1819 33 22.8481 33 22.5C33 22.1519 32.8617 21.8181 32.6156 21.5719C32.3694 21.3258 32.0356 21.1875 31.6875 21.1875Z"
          className="add-btn-fill add-btn-stroke"
        />
      </g>
      <motion.path
        initial={{
          scale: !currentHash.includes("trash") ? 0.9 : 1,
          opacity: !currentHash.includes("trash") ? 0 : 1,
        }}
        animate={{
          scale: !currentHash.includes("trash") ? 0.9 : 1,
          opacity: !currentHash.includes("trash") ? 0 : 1,
          display: !currentHash.includes("trash") ? "none" : "",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 50,
          mass: 1,
          // delay: 0.05,
        }}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.7639 13.7273C16.8135 12.2129 18.0993 11 19.6782 11H25.3218C26.9007 11 28.1865 12.2129 28.2361 13.7273H30.9653C31.5368 13.7273 32 14.175 32 14.7273C32 15.272 31.5493 15.715 30.9887 15.727C31.0405 15.855 31.0657 15.9955 31.058 16.1416L30.3127 30.3248C30.2339 31.8237 28.9535 33 27.4006 33H17.6019C16.0474 33 14.7663 31.8214 14.6896 30.3208L13.9437 15.7235C13.4149 15.679 13 15.25 13 14.7273C13 14.175 13.4632 13.7273 14.0347 13.7273H16.7639ZM18.8368 13.7273C18.8836 13.3182 19.2425 13 19.6782 13H25.3218C25.7575 13 26.1164 13.3182 26.1631 13.7273H18.8368ZM16.0158 15.7273H29.0606C29.0212 15.8248 28.9972 15.9299 28.9914 16.0402L28.246 30.2233C28.2231 30.6585 27.8514 31 27.4006 31H17.6019C17.1506 31 16.7786 30.6578 16.7564 30.2222L16.0158 15.7273Z"
        className="add-btn-fill"
      />
      {/* <motion.path
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
      /> */}
    </svg>
  );
};

export default memo(AddButton);
