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
      <div className={`section-header-icon ${iconClass}`} />
      <div
        onClick={onClick}
        className="section-header-title-wrapper"
        style={{ cursor: isLabel && "pointer" }}
      >
        <div
          style={{
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
            // marginLeft: ".4rem",
            fontWeight: "600",
            fontSize: "1.3rem",
          }}
        >
          {title}
        </div>
        {isLabel && <div className="section-header-edit-icon" />}
      </div>
      <div className="section-header-divider-wrapper">
        <div
          className={`section-header-divider ${isScrolled ? "section-header-divider-opacity" : ""}`}
        />
      </div>
    </div>
  );
};

export default SectionHeader;
