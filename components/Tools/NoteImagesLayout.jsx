import React, { useState, useEffect, useRef, memo } from "react";

const NoteImagesLayout = ({ width, images, calculateMasonryLayout }) => {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState([]);
  const [loadedImages, setLoadedImages] = useState([]);

  useEffect(() => {
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({ src, width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = (err) => {
          console.log(`Error loading image: ${src}`, err);
          reject(err);
        };
        img.src = src;
      });
    };

    if (images.length > 0) {
      Promise.all(images.map((image) => loadImage(image.url)))
        .then(setLoadedImages)
        .catch(console.log);
    }
  }, [images]);

  useEffect(() => {
    if (layout.length > 0) {
      if (calculateMasonryLayout) calculateMasonryLayout();
    }
  }, [layout.length]);

  const calculateLayout = () => {
    if (!containerRef.current || loadedImages.length === 0) return;
    const containerWidth = containerRef.current.offsetWidth; // Account for gaps
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

      // Calculate total aspect ratio for the row
      const rowAspectRatioSum = rowImages.reduce(
        (sum, img) => sum + img.width / img.height,
        0
      );

      // Calculate row height based on container width
      let rowHeight =
        (containerWidth - (rowImages.length - 1) * 3) / rowAspectRatioSum;

      // Ensure minimum height
      if (rowHeight < minImageHeight) {
        rowHeight = minImageHeight;
      }

      // Calculate widths while maintaining aspect ratios
      const row = rowImages.map((image) => {
        const width = (image.width / image.height) * rowHeight;
        return {
          src: image.src,
          width,
          height: rowHeight,
        };
      });

      // Adjust widths to exactly fit container
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
  }, [loadedImages, width]);
  

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    overflow: "hidden", // Prevent images from spilling out
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

  if (images?.length === 0 || !images) return;

  return (
    <div ref={containerRef} style={containerStyle}>
      {layout.length > 0 ? (
        layout.map((row, rowIndex) => (
          <div key={rowIndex} style={rowStyle}>
            {row.map((item, index) => (
              <img
                key={index}
                src={item.src}
                alt={`Grid item ${rowIndex * 3 + index + 1}`}
                style={{
                  ...imageStyle,
                  width: `${item.width}px`,
                  height: `${item.height}px`,
                }}
              />
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
