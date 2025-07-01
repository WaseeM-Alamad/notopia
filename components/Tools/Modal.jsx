import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Modal = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <div className="modal-content">{children}</div>,
    document.getElementById("modal-portal")
  );
};

export default Modal;
