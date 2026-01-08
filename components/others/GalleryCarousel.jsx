import React, { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ClassNames from "embla-carousel-class-names";
import { createPortal } from "react-dom";
import Button from "../Tools/Button";
import { motion } from "framer-motion";

const GalleryCarousel = ({
  isNote = false,
  isAvatar = false,
  images,
  setIsOpen,
  startIndex = 0,
  handleImageDeletion,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: false, startIndex: startIndex },
    [ClassNames()]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on("select", onSelect);

    return () => emblaApi.off("select", onSelect);
  }, [emblaApi, onSelect]);

  const scrollNext = () => emblaApi && emblaApi.scrollPrev();
  const scrollPrev = () => emblaApi && emblaApi.scrollNext();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") {
        scrollNext();
      } else if (e.key === "ArrowRight") {
        scrollPrev();
      }
    };

    window.addEventListener("keydown", handler);
    return () => removeEventListener("keydown", handler);
  });

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="gallery-carousel"
    >
      {images.length > 1 && (
        <>
          <div
            onClick={() => {
              if (selectedIndex === 0) return;
              emblaApi.scrollPrev();
            }}
            className="gallery-side-container"
            style={{ cursor: selectedIndex > 0 ? "pointer" : "default" }}
          >
            <div
              className="gallery-side-btn gallery-nav-icon"
              style={{
                rotate: "180deg",
                opacity: selectedIndex > 0 ? "1" : "0",
              }}
            />
          </div>
          <div
            onClick={() => {
              emblaApi.scrollNext();
            }}
            className="gallery-side-container"
            style={{
              right: "0",
              cursor: selectedIndex + 1 < images.length ? "pointer" : "default",
            }}
          >
            <div
              className="gallery-side-btn gallery-nav-icon"
              style={{ opacity: selectedIndex + 1 < images.length ? "1" : "0" }}
            />
          </div>
        </>
      )}
      <div className="gallery-top">
        <Button
          onClick={() => setIsOpen(false)}
          className="clear-icon-white btn-hover"
        />
        <div
          style={{
            textAlign: "center",
            height: "fit-content",
            marginRight: "auto",
          }}
        >
          {selectedIndex + 1} of {images.length}
        </div>
        {isNote && (
          <Button
            onClick={() => {
              const image = images[selectedIndex];
              setIsOpen(false);
              handleImageDeletion(image.uuid, image.url);
            }}
            className="gallery-del-icon"
          />
        )}
      </div>
      <motion.div
        initial={{ y: -window.innerHeight / 3 }}
        animate={{ y: 0 }}
        exit={{ y: -window.innerHeight / 3 }}
        transition={{ type: "spring", stiffness: 400, damping: 43, mass: 1.22 }}
        className="gallery-viewport"
        ref={emblaRef}
      >
        <div onClick={() => setIsOpen(false)} className="gallery-container">
          {images.map((image, index) => {
            return (
              <div className="gallery-slide" key={index}>
                <img
                  onClick={(e) => e.stopPropagation()}
                  className="gallery-slide-img"
                  style={{borderRadius: isAvatar && "50%"}}
                  src={image.url}
                  alt="Your alt text"
                />
              </div>
            );
          })}
        </div>
      </motion.div>
      <div
        style={{
          height: "16rem",
          width: "100%",
          backgroundColor: "red",
          bottom: "0",
        }}
      />
    </motion.div>,

    document.getElementById("modal-portal")
  );
};

export default GalleryCarousel;
