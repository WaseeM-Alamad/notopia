import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SelectionBox = ({ref}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return;

  return createPortal(
    <div ref={ref} className="selection-box"/>,
    document.getElementById("selectionBox")
  );
};

export default SelectionBox;
