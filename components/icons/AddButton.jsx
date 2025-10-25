import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";
import React, { memo } from "react";

const AddButton = () => {
  const { currentSection } = useAppContext();

  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      className="add-button-icon"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.g
        style={{ transformOrigin: "50% 50%" }}
        initial={{
          scale: currentSection.toLowerCase() === "trash" ? 0.6 : 1,
          rotate: currentSection.toLowerCase() === "trash" ? 45 : 0,
          strokeWidth: currentSection.toLowerCase() === "trash" ? "0.5" : "0",
        }}
        animate={{
          scale: currentSection.toLowerCase() === "trash" ? 0.6 : 1,
          rotate: currentSection.toLowerCase() === "trash" ? 45 : 0,
          strokeWidth: currentSection.toLowerCase() === "trash" ? "0.5" : "0",
        }}
        transition={{
          type: "spring",
          stiffness: 600,
          damping: 50,
          mass: 1,
        }}
        className="add-plus-stroke"
      >
        <path d="M22 14H16V8C16 7.73478 15.8946 7.48046 15.7071 7.29288C15.5195 7.10537 15.2652 7 15 7C14.7348 7 14.4805 7.10537 14.2929 7.29288C14.1054 7.48046 14 7.73478 14 8V14H8C7.73478 14 7.48046 14.1054 7.29288 14.2929C7.10537 14.4805 7 14.7348 7 15C7 15.2652 7.10537 15.5195 7.29288 15.7071C7.48046 15.8946 7.73478 16 8 16H14V22C14 22.2652 14.1054 22.5195 14.2929 22.7071C14.4805 22.8946 14.7348 23 15 23C15.2652 23 15.5195 22.8946 15.7071 22.7071C15.8946 22.5195 16 22.2652 16 22V16H22C22.2652 16 22.5195 15.8946 22.7071 15.7071C22.8946 15.5195 23 15.2652 23 15C23 14.7348 22.8946 14.4805 22.7071 14.2929C22.5195 14.1054 22.2652 14 22 14Z" />
      </motion.g>

      <motion.path
        initial={{
          scale: currentSection.toLowerCase() !== "trash" ? 0.9 : 1,
          opacity: currentSection.toLowerCase() !== "trash" ? 0 : 1,
        }}
        animate={{
          scale: currentSection.toLowerCase() !== "trash" ? 0.9 : 1,
          opacity: currentSection.toLowerCase() !== "trash" ? 0 : 1,
          display: currentSection.toLowerCase() !== "trash" ? "none" : "",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 50,
          mass: 1,
        }}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.1696 7.47934C10.2114 6.10264 11.2942 5 12.6238 5H17.3762C18.7058 5 19.7886 6.10264 19.8304 7.47934H22.1287C22.6099 7.47934 23 7.88635 23 8.38843C23 8.88365 22.6205 9.28638 22.1484 9.29729C22.192 9.41365 22.2132 9.54132 22.2068 9.67422L21.5791 22.568C21.5127 23.9307 20.4345 25 19.1268 25H10.8753C9.56624 25 8.48737 23.9285 8.42281 22.5644L7.79474 9.29406C7.34939 9.25361 7 8.86359 7 8.38843C7 7.88635 7.39009 7.47934 7.87129 7.47934H10.1696ZM11.9152 7.47934C11.9546 7.10744 12.2568 6.81818 12.6238 6.81818H17.3762C17.7432 6.81818 18.0454 7.10744 18.0848 7.47934H11.9152ZM9.5396 9.29752H20.5247C20.4916 9.38615 20.4713 9.48176 20.4664 9.58198L19.8388 22.4757C19.8195 22.8714 19.5065 23.1818 19.1268 23.1818H10.8753C10.4952 23.1818 10.182 22.8708 10.1633 22.4747L9.5396 9.29752Z"
        fill="white"
      />
    </svg>
  );
};

export default memo(AddButton);
