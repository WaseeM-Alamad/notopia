import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import ImageTrashIcon from "../icons/ImageTrashIcon";
import "@/assets/styles/LinearLoader.css";

const NoteImagesLayout = ({
  images,
  calculateMasonryLayout,
  isLoadingImages = [],
  modalOpen,
  deleteSource,
  noteImageDelete,
  AddNoteImageDelete,
}) => {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState([]);
  const [loadedImages, setLoadedImages] = useState([]);

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
  }, [loadedImages]);

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    zIndex: "10",
    overflow: "hidden",
  };

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
    if (deleteSource === "note") {
      noteImageDelete(imageID, url);
    } else if (deleteSource === "AddModal") {
      AddNoteImageDelete(imageID, url);
    }
  };

  if (images?.length === 0 || !images) return;

  return (
    <div ref={containerRef} style={containerStyle}>
      {layout.length > 0 ? (
        layout.map((row, rowIndex) => (
          <div key={rowIndex} style={rowStyle}>
            {row.map((item) => (
              <div
                style={{
                  opacity: isLoadingImages.includes(item.id) ? "0.6" : "1",
                }}
                className="img-wrapper"
                key={item.src}
              >
                <img
                  src={item.src}
                  draggable={false}
                  alt={`Grid item ${item.src}`}
                  style={{
                    ...imageStyle,
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                  }}
                />
                {isLoadingImages.includes(item.id) && (
                  <div key={item.src} className="linear-loader" />
                )}
                {modalOpen && (
                  <div
                    onClick={() => handleImageDeletion(item.id, item.src)}
                    className="img-delete"
                  >
                    <ImageTrashIcon size={18} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      ) : (
        <></>
      )}
    </div>
  );
};

export default memo(NoteImagesLayout);
