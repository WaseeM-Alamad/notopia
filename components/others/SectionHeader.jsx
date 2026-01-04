import React, { useEffect, useState } from "react";

const SectionHeader = ({
  title = "",
  iconClass = "",
  isLabel = false,
  onClick = () => {},
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!title.trim()) return null;

  return (
    <div
      className={`section-header ${isScrolled ? "nav-shadow" : ""} ${isLabel ? "is-label-section" : ""}`}
    >
      <div className={iconClass} />
      <div
        onClick={onClick}
        className="section-header-title-wrapper"
        style={{ cursor: isLabel && "pointer" }}
      >
        <div
          style={{
            marginLeft: ".4rem",
            fontWeight: "600",
            fontSize: "1.3rem",
            flexShrink: "0",
          }}
        >
          {title + ""}
        </div>
        {isLabel && <div className="section-header-edit-icon" />}
      </div>
      <div
        style={{
          width: "100%",
          height: "1px",
          marginLeft: "1rem",
          backgroundColor: "var(--border)",
          transition: "opacity 0.13s ease",
        }}
        className={isScrolled ? "section-header-divider-opacity" : ""}
      />
    </div>
  );
};

export default SectionHeader;
