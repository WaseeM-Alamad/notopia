import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import "@/assets/styles/LinearLoader.css";
import { useAppContext } from "@/context/AppContext";
import GalleryCarousel from "../others/GalleryCarousel";
import { AnimatePresence } from "framer-motion";

const NoteImagesLayout = ({
  images = [],
  modalOpen = false,
  isTrash = false,
  deleteSource,
  noteImageDelete,
  AddNoteImageDelete,
}) => {
  const {
    loadingImages,
    showTooltip,
    hideTooltip,
    closeToolTip,
    calculateLayoutRef,
  } = useAppContext();
  const calculateMasonryLayout = calculateLayoutRef.current;
  const containerRef = useRef(null);
  const [layout, setLayout] = useState([]);
  const [loadedImages, setLoadedImages] = useState([]);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const startIndexRef = useRef(0);

  useEffect(() => {
    if (!modalOpen) {
      setCarouselOpen(false);
      startIndexRef.current = 0;
    }
  }, [modalOpen]);

  useEffect(() => {
    const loadImage = (src, id) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            src,
            id,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.onerror = (err) => {
          console.log(`Error loading image: ${src}`, err);
          reject(err);
        };
        img.src = src;
      });
    };

    if (images.length > 0) {
      Promise.all(images.map((image) => loadImage(image.url, image.uuid)))
        .then(setLoadedImages)
        .catch(console.log);
    } else if (loadedImages.length !== 0) {
      // setLayout([]);
      // setLoadedImages([]);
    }
  }, [images]);

  useEffect(() => {
    if (layout.length > 0) {
      if (calculateMasonryLayout) {
        calculateMasonryLayout();
        setTimeout(() => {
          calculateMasonryLayout();
        }, 100);
      }
    }
  }, [layout.length]);

  const calculateLayout = () => {
    if (!containerRef.current || loadedImages.length === 0) return;
    const containerWidth = containerRef.current.offsetWidth;
    const maxRows = 4;
    const maxImagesPerRow = 3;
    const minImageHeight = 80;
    const newLayout = [];

    for (
      let i = 0;
      i < Math.min(maxRows, Math.ceil(loadedImages.length / maxImagesPerRow));
      i++
    ) {
      const rowImages = loadedImages.slice(
        i * maxImagesPerRow,
        (i + 1) * maxImagesPerRow
      );

      const rowAspectRatioSum = rowImages.reduce(
        (sum, img) => sum + img.width / img.height,
        0
      );

      let rowHeight =
        (containerWidth - (rowImages.length - 1) * 3) / rowAspectRatioSum;

      if (rowHeight < minImageHeight) {
        rowHeight = minImageHeight;
      }

      const row = rowImages.map((image) => {
        const width = (image.width / image.height) * rowHeight;
        return {
          src: image.src,
          id: image.id,
          width,
          height: rowHeight,
        };
      });

      const totalWidth = row.reduce((sum, img) => sum + img.width, 0);
      const scale = containerWidth / (totalWidth + (row.length - 1) * 3);

      row.forEach((item) => {
        item.width *= scale;
        item.height *= scale;
      });

      newLayout.unshift(row);
    }

    setLayout(newLayout);
  };

  useEffect(() => {
    calculateLayout();
    requestAnimationFrame(() => calculateLayout());
  }, [loadedImages]);

  useEffect(() => {
    const handler = () => {
      calculateLayout();
    };

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [loadedImages]);

  const rowStyle = {
    display: "flex",
    gap: "3px",
    width: "100%",
  };

  const imageStyle = {
    objectFit: "cover",
    display: "block",
  };

  const handleImageDeletion = (imageID, url) => {
    closeToolTip();
    if (deleteSource === "note") {
      noteImageDelete(imageID, url);
    } else if (deleteSource === "AddModal") {
      AddNoteImageDelete(imageID, url);
    }
  };

  if (images?.length === 0 || !images) return;

  return (
    <div
      onClick={(e) => {
        if (!modalOpen && !isTrash) return;
        e.stopPropagation();
      }}
      ref={containerRef}
      className="images-layout-container"
    >
      {layout.length > 0 ? (
        layout.map((row, rowIndex) => (
          <div key={rowIndex} style={rowStyle}>
            {row.map((item) => (
              <div
                style={{
                  opacity: loadingImages.has(item.id) ? "0.6" : "1",
                }}
                className="img-wrapper"
                onClick={() => {
                  if (!modalOpen) return;
                  requestIdleCallback(() => {
                    const index = images.findIndex(
                      (image) => image.url === item.src
                    );
                    startIndexRef.current = index;
                    setCarouselOpen(true);
                  });
                }}
                key={item.src}
              >
                <img
                  loading="lazy"
                  src={item.src}
                  draggable={false}
                  alt={`note image`}
                  style={{
                    ...imageStyle,
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                  }}
                />
                {loadingImages.has(item.id) && (
                  <div key={item.src} className="linear-loader" />
                )}
                {modalOpen && !isTrash && (
                  <div
                    onMouseEnter={(e) => showTooltip(e, "Remove image")}
                    onMouseLeave={hideTooltip}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageDeletion(item.id, item.src);
                    }}
                    className="img-delete"
                  />
                )}
              </div>
            ))}
          </div>
        ))
      ) : (
        <></>
      )}
      <AnimatePresence>
        {carouselOpen && (
          <GalleryCarousel
            images={images}
            setIsOpen={setCarouselOpen}
            startIndex={startIndexRef.current}
            handleImageDeletion={handleImageDeletion}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(NoteImagesLayout);
