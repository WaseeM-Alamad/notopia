import { motion } from "framer-motion";
import React, { memo, useState } from "react";
import SliderOverlay from "./SliderOverlay";

const slides = [
  {
    image:
      "https://picsum.photos/800/600",
    html: (
      <span style={{ fontSize: "1.7rem", fontWeight: "600" }}>
        Welcome to your
        <br /> personal hub for
        <br /> ideas and productivity
      </span>
    ),
  },
  {
    image: "https://picsum.photos/800/601",
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
  return (
    <div
      className="login-slider-wrapper"
      style={{ transform: isLogin ? "translateX(0)" : "translateX(-85.19%)" }}
    >
      <div className="login-slider">
        <SliderOverlay
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          slides={slides}
        />
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
                transition: `opacity 0.6s ease-out, transform ${isCurrentSlide ? "10s linear" : ".9s ease-outt"}`,
                opacity: isCurrentSlide ? "1" : "0",
                zIndex: isCurrentSlide ? "5" : "",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default memo(AuthSlider);
