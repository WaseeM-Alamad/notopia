import { AnimatePresence } from "framer-motion";
import React, { memo } from "react";
import SideBtn from "./SideBtn";

const SideButtons = ({
  navItems,
  currentHash,
  calculateVerticalLayout,
  pageMounted,
  containerRef,
  handleDragStart,
  setOverUUID,
  overUUID,
  isDragging,
}) => {
  return (
    <AnimatePresence>
      {navItems.map(({ type, name, hash, Icon, uuid: labelUUID }) => (
        <SideBtn
          key={labelUUID || hash}
          type={type}
          name={name}
          hash={hash}
          Icon={Icon}
          labelUUID={labelUUID}
          currentHash={currentHash}
          calculateVerticalLayout={calculateVerticalLayout}
          pageMounted={pageMounted}
          containerRef={containerRef}
          handleDragStart={handleDragStart}
          setOverUUID={setOverUUID}
          overUUID={overUUID}
          isDragging={isDragging}
        />
      ))}
    </AnimatePresence>
  );
};

export default memo(SideButtons);
