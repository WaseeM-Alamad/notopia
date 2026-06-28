import React, { useEffect, useRef, useCallback } from "react";

const DURATION = 4000;

const SliderOverlay = ({ currentIndex, setCurrentIndex, slides }) => {
  const intervalRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const fillRefs = useRef([]);

  const startFillAnimation = useCallback((idx) => {
    cancelAnimationFrame(rafRef.current);

    fillRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i < idx) {
        el.style.transition = "width 0.3s ease";
        el.style.width = "100%";
      } else {
        el.style.transition = "none";
        el.style.width = "0%";
      }
    });

    startTimeRef.current = performance.now();

    const tick = () => {
      const pct =
        Math.min((performance.now() - startTimeRef.current) / DURATION, 1) *
        100;
      if (fillRefs.current[idx]) fillRefs.current[idx].style.width = `${pct}%`;
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const resetInterval = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1 > slides.length - 1 ? 0 : prev + 1));
    }, DURATION);
  }, [slides.length, setCurrentIndex]);

  useEffect(() => {
    resetInterval();
    return () => {
      clearInterval(intervalRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    startFillAnimation(currentIndex);
  }, [currentIndex, startFillAnimation]);

  const sliderClick = (index) => {
    if (currentIndex === index) return;
    resetInterval();
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    resetInterval();
    setCurrentIndex((prev) => (prev + 1 > slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    resetInterval();
    setCurrentIndex((prev) => (prev - 1 < 0 ? slides.length - 1 : prev - 1));
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
          bottom: 0,
          width: "100%",
          padding: "1.4rem 3rem",
          boxSizing: "border-box",
        }}
      >
        {slides.map((_, index) => (
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
                  left: 0,
                  top: 0,
                  height: "3px",
                  opacity: index < currentIndex ? 1 : 0.4,
                  transition: "opacity 0.3s ease",
                }}
              />
              <div
                ref={(el) => {
                  fillRefs.current[index] = el;
                }}
                style={{
                  position: "absolute",
                  borderRadius: "10rem",
                  backgroundColor: "#ededed",
                  width: "0%",
                  left: 0,
                  top: 0,
                  height: "3px",
                  zIndex: 2,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SliderOverlay;
