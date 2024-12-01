import { Close } from "@mui/icons-material";
import { IconButton, Snackbar } from "@mui/material";
import SnackbarContent from "@mui/material/SnackbarContent";

import React from "react";

const SnackBar = ({
  open,
  ref,
  setIsOpen,
  setIsTrash,
  setIsLoading,
  handleUpdate,
  setNoteDisplay,
  setNoteOpacity,
  isotopeRef,
}) => {
  const handleSnackClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setIsOpen(false);
  };

  return (
    <Snackbar
      style={{ zIndex: "100" }}
      ref={ref}
      open={open}
      onClose={handleSnackClose}
      autoHideDuration={4000}
    >
      <SnackbarContent
        sx={{
          minHeight: "2.25rem",
          width: "25.875rem",
          maxWidth: "25.875rem",
          padding: "0.625rem 1rem 0.625rem 1.25rem",
          border: "solid rgb(50, 50, 50) 4px",
        }}
        message="Note trashed"
        action={
          <>
            <button
              aria-label="close"
              onClick={async () => {
                setIsTrash(false);
                setNoteOpacity(true);
                setNoteDisplay(true);
                setIsOpen(false);

                setTimeout(() => {
                  isotopeRef.current.arrange();
                }, 10);

                setIsLoading(true);
                await handleUpdate("isTrash", false);
                setTimeout(() => {
                  setIsLoading(false);
                }, 700);
              }}
              className="snackbar-button noto-sans-regular"
            >
              <span style={{ userSelect: "none" }}>Undo</span>
            </button>
            <IconButton
              disableTouchRipple
              sx={{
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.041)" },
                padding: "0.25rem",
              }}
              onClick={() => {
                setIsOpen(false);
              }}
            >
              <Close
                sx={{
                  width: "1.2rem",
                  height: "1.2rem",
                  padding: "0.01rem",
                  color: "white",
                }}
              />
            </IconButton>
          </>
        }
      />
    </Snackbar>
  );
};

export default SnackBar;
