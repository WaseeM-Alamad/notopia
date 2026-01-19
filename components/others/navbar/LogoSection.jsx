import Button from "@/components/Tools/Button";
import { useAppContext } from "@/context/AppContext";
import { useGlobalContext } from "@/context/GlobalContext";
import React, { memo } from "react";

const LogoSection = () => {
  const { hideTooltip, showTooltip, closeToolTip } = useAppContext();

  const { setIsExpanded } = useGlobalContext();

  const handleMenuClick = () => {
    closeToolTip();
    const width = window.innerWidth;
    setIsExpanded((prev) => ({
      open: !prev.open,
      threshold: width < 605 ? "before" : "after",
    }));
  };

  return (
    <div className="logo">
      <Button
        onClick={handleMenuClick}
        onMouseEnter={(e) =>
          showTooltip(e, <span style={{ fontWeight: 550 }}>Main menu</span>)
        }
        onMouseLeave={hideTooltip}
        className="side-expand-btn"
      />
      <span
        onClick={() => (window.location.hash = "home")}
        className="notopia nav-logo"
      >
        Notopia
      </span>
    </div>
  );
};

export default memo(LogoSection);
