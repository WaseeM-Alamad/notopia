import React, { useState, useEffect, useRef } from "react";

const GridLayout = ({ images }) => {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState([]);
  const [loadedImages, setLoadedImages] = useState([]);

  useEffect(() => {
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () =>
          resolve({ src, width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = reject;
        img.src = src;
      });
    };

    Promise.all(images.map(loadImage))
      .then(setLoadedImages)
      .catch(console.error);
  }, [images]);

  useEffect(() => {
    const calculateLayout = () => {
      if (!containerRef.current || loadedImages.length === 0) return;

      const containerWidth = containerRef.current.offsetWidth;
      const maxRows = 3;
      const maxImagesPerRow = 3;
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
        const rowHeight = containerWidth / rowAspectRatioSum;

        const row = rowImages.map((image) => ({
          src: image.src,
          width: (image.width / image.height) * rowHeight,
          height: rowHeight,
        }));

        newLayout.push(row);
      }

      setLayout(newLayout);
    };

    calculateLayout();
    window.addEventListener("resize", calculateLayout);
    return () => window.removeEventListener("resize", calculateLayout);
  }, [loadedImages]);

  const containerStyle = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const rowStyle = {
    display: "flex",
    gap: "4px",
    width: "100%",
  };

  const imageStyle = {
    objectFit: "cover",
    display: "block",
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {layout.map((row, rowIndex) => (
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
      ))}
    </div>
  );
};

export default GridLayout;