import React, { useEffect, useRef } from "react";

const SliderOverlay = ({ currentIndex, setCurrentIndex, slides }) => {
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev + 1 > slides.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const resetInterval = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev + 1 > slides.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 4000);
  };

  const sliderClick = (index) => {
    resetInterval();
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    resetInterval();
    setCurrentIndex((prev) => {
      if (prev + 1 > slides.length - 1) {
        return 0;
      }
      return prev + 1;
    });
  };

  const prevSlide = () => {
    resetInterval();
    setCurrentIndex((prev) => {
      if (prev - 1 < 0) {
        return slides.length - 1;
      }
      return prev - 1;
    });
  };

  return (
    <div className="slider-overlay" style={{ "--slides-num": slides.length }}>
      <button
        className="auth-slide-arrow"
        onClick={nextSlide}
        style={{ right: "1.5rem", left: "unset" }}
      >
        ›
      </button>
      <button className="auth-slide-arrow" onClick={prevSlide}>
        ‹
      </button>

      <div className="slider-content">
        <div className="slider-logo">Notopia</div>
        {slides.map(({ html }, index) => {
          const isCurrentSlide = currentIndex === index;
          const isRightToCurrent = index > currentIndex;
          const numBetween = Math.max(Math.abs(currentIndex - index), 1);
          return (
            <div
              key={index}
              className="auth-slide"
              style={{
                opacity: isCurrentSlide ? "1" : "0.1",
                transform: isCurrentSlide
                  ? "translateX(0)"
                  : isRightToCurrent
                    ? `translateX(${numBetween * 500}px)`
                    : `translateX(-${numBetween * 500}px)`,
                transition: `opacity ${0.4 + numBetween / 10}s ease-in-out, transform ${0.9 + numBetween / 10}s cubic-bezier(.48,.025,.215,1)`,
              }}
            >
              {html}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.7rem",
          position: "absolute",
          bottom: "0",
          width: "100%",
          padding: "1.4rem 3rem",
          boxSizing: "border-box",
        }}
      >
        {slides.map((_, index) => {
          currentIndex - index === 1 && console.log(index);
          return (
            <div
              className="slide-indicator"
              onClick={() => sliderClick(index)}
              key={index}
            >
              <div
                style={{
                  position: "relative",
                  borderRadius: "10rem",
                  width: "100%",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    borderRadius: "10rem",
                    backgroundColor: "#ededed",
                    width: "100%",
                    left: "0",
                    top: "0",
                    height: "3px",
                    opacity: index < currentIndex ? "1" : ".4",
                    transition: `opacity ${index < currentIndex ? "0.5s ease" : "0.5s ease"}`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    borderRadius: "10rem",
                    backgroundColor: "#ededed",
                    width: currentIndex === index ? "100%" : "0%",
                    left: "0",
                    top: "0",
                    height: "3px",
                    opacity: currentIndex - index !== 1 ? "1" : "0",
                    zIndex: "2",
                    visibility: currentIndex === index ? "visible" : "hidden",
                    transition: `width ${currentIndex === index ? "3.8" : ".3"}s linear`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    borderRadius: "10rem",
                    backgroundColor: "#ededed",
                    width:
                      currentIndex > index || currentIndex === index
                        ? "100%"
                        : "0%",
                    // width: "100%",
                    left: "0",
                    top: "0",
                    height: "3px",
                    opacity: currentIndex - index === 1 ? "1" : "0",
                    zIndex: "2",
                    transition: `width ${currentIndex === index ? "3.8" : "0"}s linear`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SliderOverlay;
