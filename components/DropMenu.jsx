import * as React from "react";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Stack from "@mui/material/Stack";
import MoreIcon from "./MoreIcon";
import { IconButton, Tooltip } from "@mui/material";
import deleteNote from "@/actions/deleteNote";
import Snack from "@/components/DeleteNoteSnack";

export default function DropMenu({
  open,
  setOpen,
  setNoteDisplay,
  setNoteOpacity,
  dropMenuRef,
  isotopeRef,
  handleMenuHover,
  Noteuuid,
  userID,
  setIsTrash,
  isTrash,
  handleUpdate,
  setIsLoading,
  setIsDeleteSnackOpen,
}) {
  const anchorRef = React.useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const menuStyle = {
    fontSize: "0.850rem",
    fontFamily: "Open Sans",
    padding: "6px 11px 6px 15px",
    width: "130px",
    height: "30px",
    border: "solid 1px white",
    color: "rgb(60,64,67)",
    letterSpacing: ".0142857143em",
    lineHeight: "1.25rem",
    cursor: "pointer",
    userSelect: "none",
    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
  };

  const menuItemsWrapperStyle = {
    boxShadow:
      "0 1px 2px 0 rgba(60,64,67,0.3),0 2px 6px 2px rgba(60,64,67,0.15)",
    borderRadius: "4px",
    padding: "6px 0px 6px 0px ",
    positions: "absolute",
  };

  const TooltipPosition = {
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, -11], // Adjust position (x, y)
        },
      },
    ],
  };

  const slotProps = {
    tooltip: {
      sx: {
        height: "fit-content",
        margin: "0",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        fontFamily: "Roboto",
        fontWeight: "400",
        fontSize: "0.76rem",
        padding: "5px 8px 5px 8px",
      },
    },
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event?.target)) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }

    prevOpen.current = open;
  }, [open]);

  const handleDelete = async () => {
    if (isTrash) {
      // if isTrash is true
      setNoteOpacity(false);
      setTimeout(() => {
        setNoteDisplay(false);
        setTimeout(() => {
          isotopeRef.current.arrange();
        }, 10);
      }, 270);
      setIsLoading(true);
      await deleteNote(Noteuuid, userID);
      setTimeout(() => {
        setIsLoading(false);
      }, 700);
    } else {
      setIsDeleteSnackOpen(true);
      setIsTrash(true);
      setNoteOpacity(false);
      setTimeout(() => {
        setNoteDisplay(false);
        setTimeout(() => {
          isotopeRef.current.arrange();
        }, 10);
      }, 270);
      setIsLoading(true);
      await handleUpdate("isTrash", true);
      setTimeout(() => {
        setIsLoading(false);
      }, 700);
    }

    handleClose();
  };

  return (
    <Stack direction="row" spacing={2}>
      <div ref={dropMenuRef} style={{ zIndex: "99" }}>
        <Tooltip
          slotProps={slotProps}
          PopperProps={TooltipPosition}
          sx={{ zIndex: "100" }}
          title="More"
          disableInteractive
        >
          <IconButton
            disableTouchRipple
            sx={{
              width: "34px",
              height: "34px",
              padding: "6px",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
            }}
            ref={anchorRef}
            id="composition-button"
            aria-controls={open ? "composition-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            onClick={handleToggle}
          >
            <MoreIcon />
          </IconButton>
        </Tooltip>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          placement="bottom-start"
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === "bottom-start" ? "left top" : "left bottom",
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    sx={menuItemsWrapperStyle}
                    onMouseOver={handleMenuHover}
                    autoFocusItem={open}
                    id="composition-menu"
                    aria-labelledby="composition-button"
                    onKeyDown={handleListKeyDown}
                  >
                    <MenuItem sx={menuStyle} onClick={handleDelete}>
                      Delete note
                    </MenuItem>
                    <MenuItem sx={menuStyle} onClick={handleClose}>
                      Change labels
                    </MenuItem>
                    <MenuItem sx={menuStyle} onClick={handleClose}>
                      Make a copy
                    </MenuItem>
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    </Stack>
  );
}
