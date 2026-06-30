import { motion } from "framer-motion";
import React, { memo, useLayoutEffect, useRef, useState } from "react";
import SliderOverlay from "./SliderOverlay";
import NotopiaLogo from "../icons/NotopiaLogo";

const slides = [
  {
    image:
      "https://res.cloudinary.com/dhp3zvrdz/image/upload/v1782806987/image_vyhtta.webp",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Welcome to your
        <br /> personal hub for
        <br /> ideas and productivity
      </span>
    ),
  },
  {
    image:
      "https://res.cloudinary.com/dhp3zvrdz/image/upload/v1782806966/notopia_vbtzmp.png",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Simple, fast, and
        <br /> designed for a
        <br /> productive workflow
      </span>
    ),
  },
  {
    image:
      "https://res.cloudinary.com/dhp3zvrdz/image/upload/v1782807546/Screenshot_2026-06-30_111844_p55iaa.png",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Organize your notes
        <br /> with custom labels
        <br /> and categories
      </span>
    ),
  },
  {
    image:
      "https://res.cloudinary.com/dhp3zvrdz/image/upload/v1782806837/images_preview_jnbuze.png",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Add images and
        <br /> screenshots to make
        <br /> notes more visual
      </span>
    ),
  },
  {
    image:
      "https://res.cloudinary.com/dhp3zvrdz/image/upload/v1782810817/collab_kdj0cw.png",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Collaborate with
        <br /> friends and teammates
        <br /> in real time
      </span>
    ),
  },
  {
    image:
      "https://res.cloudinary.com/dhp3zvrdz/image/upload/v1782813322/477f1a72-473b-4324-a8e9-fc00d96de480.png",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Turn scattered ideas
        <br /> into organized
        <br /> knowledge
      </span>
    ),
  },
];

const AuthSlider = ({ isLogin }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const initialStateRef = useRef(isLogin);

  return (
    <div
      className="login-slider-wrapper"
      style={
        initialStateRef.current
          ? {
              transform: isLogin ? "translateX(0)" : "translateX(-85.19%)",
              right: "0",
              left: "unset",
            }
          : {
              transform: !isLogin ? "translateX(0)" : "translateX(85.19%)",
              left: "0",
              right: "unset",
            }
      }
    >
      <div className="login-slider">
        <SliderOverlay
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          slides={slides}
        />
        <div
          style={{
            background: "var(--notopia-bg)",
            width: "300rem",
            height: "300rem",
            animation: "fade-out 2.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translateX(-50%) translateY(-40%)",
              width: "fit-content",
              transformOrigin: "center",
            }}
          >
            <motion.div
              initial={{
                transform: "scale(2.8)",
              }}
              animate={{
                transform: "scale(1)",
              }}
              transition={{
                type: "tween",
                ease: [0.52, 1, 0.16, 1],
                duration: 2.45,
              }}
            >
              <NotopiaLogo fixedColors={true} />
            </motion.div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            animation: "fade-in 2.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {slides.map(({ image }, index) => {
            const isCurrentSlide = currentIndex === index;
            const slideNum = index + 1;
            return (
              <img
                key={index}
                src={image ?? undefined}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  userSelect: "none",
                  transform: isCurrentSlide
                    ? `scale(${1.2 + (slideNum + 1) / 10})`
                    : `scale(${1 + slideNum / 10.5})`,
                  transition: `opacity 0.6s ease-out, transform ${isCurrentSlide ? "10s linear" : "5s cubic-bezier(0.85, -0.2, 1, 0.11)"}`,
                  opacity: isCurrentSlide ? "1" : "0",
                  zIndex: isCurrentSlide ? "5" : "",
                  willChange: "transform",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(AuthSlider);
