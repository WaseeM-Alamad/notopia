import React, { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ClassNames from "embla-carousel-class-names";
import { createPortal } from "react-dom";
import Button from "../Tools/Button";
import { motion } from "framer-motion";

const GalleryCarousel = ({
  images,
  setIsOpen,
  startIndex,
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
        <Button
          onClick={() => {
            const image = images[selectedIndex];
            setIsOpen(false);
            handleImageDeletion(image.uuid, image.url);
          }}
          className="gallery-del-icon"
        />
      </div>
      <motion.div
        initial={{ y: -window.innerHeight / 3 }}
        animate={{ y: 0 }}
        exit={{ y: -window.innerHeight / 3 }}
        transition={{ type: "spring", stiffness: 400, damping: 43, mass: 1.22 }}
        className="gallery-viewport"
        ref={emblaRef}
      >
        <div className="gallery-container">
          {images.map((image, index) => {
            return (
              <div className="gallery-slide" key={index}>
                <img
                  className="gallery-slide-img"
                  src={image.url}
                  alt="Your alt text"
                />
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>,

    document.getElementById("modal-portal")
  );
};

export default GalleryCarousel;
