import { motion } from "framer-motion";
import React, { memo, useLayoutEffect, useRef, useState } from "react";
import SliderOverlay from "./SliderOverlay";
import NotopiaLogo from "../icons/NotopiaLogo";

const slides = [
  {
    image:
      "https://media.discordapp.net/attachments/1099998106227060789/1520481484795019366/image.png?ex=6a4202fb&is=6a40b17b&hm=90545e3808646e38301490983630915bd91eeb8143e9a4263e0295d4ca9c4910&=&format=webp&quality=lossless&width=767&height=960",
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
      "https://media.discordapp.net/attachments/1099998106227060789/1520936643136065817/image.png?ex=6a430221&is=6a41b0a1&hm=3a099f0e3d08e12d15a19bb2d1e52f18d6b215961b21e5c3a09663a1d0fd12a1&=&format=webp&quality=lossless",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Simple, fast, and
        <br /> designed for a
        <br /> productive workflow
      </span>
    ),
  },
  {
    image: "https://picsum.photos/800/602",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Organize your notes
        <br /> with custom labels
        <br /> and categories
      </span>
    ),
  },
  {
    image: "https://picsum.photos/800/603",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Add images and
        <br /> screenshots to make
        <br /> notes more visual
      </span>
    ),
  },
  {
    image: "https://picsum.photos/800/604",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Archive notes to keep
        <br /> your workspace clean
        <br /> and focused
      </span>
    ),
  },
  {
    image: "https://picsum.photos/800/605",
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
                    ? `scale(${1.1 + (slideNum + 1) / 10})`
                    : `scale(${1 + slideNum / 10.5})`,
                  transition: `opacity 0.6s ease-out, transform ${isCurrentSlide ? "10s linear" : "5s ease-in"}`,
                  opacity: isCurrentSlide ? "1" : "0",
                  zIndex: isCurrentSlide ? "5" : "",
                  willChange: "transform"
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
