import React, { memo, useCallback, useRef, useState } from "react";
import PersonAdd from "../icons/PersonAdd";
import Bell from "../icons/Bell";
import ArchiveIcon from "../icons/ArchiveIcon";
import ImageIcon from "../icons/ImageIcon";
import Button from "../Tools/Button";
import ColorIcon from "../icons/ColorIcon";
import MoreVert from "../icons/MoreVert";
import ColorSelectMenu from "./ColorSelectMenu";
import BackIcon from "../icons/BackIcon";
import { NoteUpdateAction } from "@/utils/actions";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import ModalMenu from "./ModalMenu";
import ManageLabelsMenu from "./ManageLabelsMenu";
import ManageModalLabels from "./ManageModalLabels";

const NoteModalTools = ({
  trigger,
  setLocalImages,
  selectedColor,
  setSelectedColor,
  selectedBG,
  setSelectedBG,
  openSnackFunction,
  dispatchNotes,
  modalLabels,
  setModalLabels,
  note,
  // setIsLoadingImages,
  setTooltipAnchor,
  archiveRef,
  trashRef,
  imagesChangedRef,
  setIsOpen,
  undoStack,
  redoStack,
  handleUndo,
  handleRedo,
}) => {
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [anchorEl, setAnchorEl] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const { data: session } = useSession();
  const userID = session?.user?.id;
  const colorButtonRef = useRef(null);
  const closeRef = useRef(null);
  const inputRef = useRef(null);

  const handleColorClick = useCallback(async (color) => {
    if (color === selectedColor) return;
    setSelectedColor(color);
    dispatchNotes({
      type: "UPDATE_COLOR",
      note: note,
      newColor: color,
    });
    window.dispatchEvent(new Event("loadingStart"));
    await NoteUpdateAction("color", color, [note.uuid]);
    window.dispatchEvent(new Event("loadingEnd"));
  });

  const handleBackground = useCallback(
    async (newBG) => {
      closeToolTip();
      if (selectedBG === newBG) return;
      setSelectedBG(newBG);

      dispatchNotes({
        type: "UPDATE_BG",
        note: note,
        newBG: newBG,
      });
      console.log("yes");
      window.dispatchEvent(new Event("loadingStart"));
      await NoteUpdateAction("background", newBG, [note.uuid]);
      window.dispatchEvent(new Event("loadingEnd"));
    },
    [selectedBG]
  );

  const UploadImageAction = async (image) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
      const bucketName = "notopia";

      const filePath = `${userID}/${note.uuid}/${image.id}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, image.file, {
          cacheControl: "0",
        });

      if (error) {
        console.error("Error uploading file:", error);
      }
    } catch (error) {
      console.log("couldn't upload images", error);
    }
  };

  const handleOnChange = async (event) => {
    imagesChangedRef.current = true;
    const file = event.target?.files[0];
    const imageURL = URL.createObjectURL(file);
    const newUUID = uuid();

    setLocalImages((prev) => [...prev, { url: imageURL, uuid: newUUID }]);
    inputRef.current.value = "";
    window.dispatchEvent(new Event("loadingStart"));
    const starter =
      "https://fopkycgspstkfctmhyyq.supabase.co/storage/v1/object/public/notopia";
    const path = `${starter}/${userID}/${note.uuid}/${newUUID}`;
    // setIsLoadingImages((prev) => [...prev, newUUID]);
    await NoteUpdateAction("images", { url: path, uuid: newUUID }, [note.uuid]);
    await UploadImageAction({ file: file, id: newUUID }, note.uuid);
    // setIsLoadingImages((prev) => prev.filter((id) => id !== newUUID));
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const handleMouseEnter = (e, text) => {
    const target = e.currentTarget;
    setTooltipAnchor({ anchor: target, text: text, display: true });
  };

  const handleMouseLeave = () => {
    setTooltipAnchor((prev) => ({
      ...prev,
      display: false,
    }));
  };

  const closeToolTip = () => {
    setTooltipAnchor((prev) => ({
      anchor: null,
      text: prev?.text,
    }));
  };

  const toggleColorMenu = (e) => {
    closeToolTip();
    setColorAnchorEl(e.currentTarget);
    setColorMenuOpen(!colorMenuOpen);
  };

  const handleModalArchive = (e) => {
    closeToolTip();
    archiveRef.current = true;

    setIsOpen(false);
  };

  return (
    <>
      <div style={{ opacity: "1" }} className={`modal-bottom  `}>
        {/* <p className="date">{FormattedDate}</p> */}
        <div className="modal-bottom-icons">
          <Button className="reminder-icon btn-hover" />
          <Button className="person-add-icon btn-hover" />
          <Button
            className="close archive-icon btn-hover"
            onClick={handleModalArchive}
            onMouseEnter={(e) => handleMouseEnter(e, "Archive")}
            onMouseLeave={handleMouseLeave}
          />
          <Button
            className="image-icon btn-hover"
            onClick={() => {
              closeToolTip();
              inputRef.current.click();
            }}
            onMouseEnter={(e) => handleMouseEnter(e, "Add image")}
            onMouseLeave={handleMouseLeave}
          >
            <input
              ref={inputRef}
              style={{ display: "none" }}
              type="file"
              onChange={handleOnChange}
            />
          </Button>
          <Button
            className="color-icon btn-hover"
            onClick={toggleColorMenu}
            onMouseEnter={(e) => handleMouseEnter(e, "Background options")}
            onMouseLeave={handleMouseLeave}
          />
          <AnimatePresence>
            {colorMenuOpen && (
              <ColorSelectMenu
                handleColorClick={handleColorClick}
                handleBackground={handleBackground}
                anchorEl={colorAnchorEl}
                selectedColor={selectedColor}
                selectedBG={selectedBG}
                setSelectedBG={setSelectedBG}
                setTooltipAnchor={setTooltipAnchor}
                isOpen={colorMenuOpen}
                setIsOpen={setColorMenuOpen}
              />
            )}
          </AnimatePresence>
          <Button
            onClick={(e) => {
              closeToolTip();
              setAnchorEl(e.currentTarget);
              setMoreMenuOpen((prev) => !prev);
              setLabelsOpen(false);
            }}
            onMouseEnter={(e) => handleMouseEnter(e, "More")}
            onMouseLeave={handleMouseLeave}
            className="more-icon btn-hover"
          />
          <>
            <Button onClick={handleUndo} disabled={undoStack.length === 0}>
              <BackIcon />
            </Button>
            <Button onClick={handleRedo} disabled={redoStack.length === 0}>
              <BackIcon direction="1" />
            </Button>
          </>
        </div>
        <button
          ref={closeRef}
          onClick={() => setIsOpen(false)}
          className="close close-btn"
        >
          Close
        </button>
      </div>
      <AnimatePresence>
        {moreMenuOpen && !labelsOpen && (
          <ModalMenu
            setIsOpen={setMoreMenuOpen}
            setModalOpen={setIsOpen}
            dispatchNotes={dispatchNotes}
            anchorEl={anchorEl}
            trashRef={trashRef}
            isOpen={moreMenuOpen}
            setLabelsOpen={setLabelsOpen}
            openSnackFunction={openSnackFunction}
            note={note}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {labelsOpen && (
          <ManageModalLabels
            dispatchNotes={dispatchNotes}
            note={note}
            isOpen={labelsOpen}
            setIsOpen={setLabelsOpen}
            modalLabels={modalLabels}
            setModalLabels={setModalLabels}
            anchorEl={anchorEl}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(NoteModalTools);
