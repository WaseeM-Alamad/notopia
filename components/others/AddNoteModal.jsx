import React, { useState, useEffect, useRef, memo } from "react";
import "@/assets/styles/modal.css";
import "@/assets/styles/LinearLoader.css";
import { createPortal } from "react-dom";
import { createNoteAction } from "@/utils/actions";
import { v4 as uuid } from "uuid";
import ModalTools from "./ModalTools";
import PinIcon from "../icons/PinIcon";
import Button from "../Tools/Button";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import { useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";

const AddNoteModal = ({
  trigger,
  setTrigger,
  setNotes,
  lastAddedNoteRef,
  setIsLoadingImages,
}) => {
  const { data: session } = useSession();
  const userID = session?.user?.id;
  const [note, setNote] = useState({
    uuid: "",
    title: "",
    content: "",
    color: "#FFFFFF",
    labels: [],
    isPinned: false,
    isArchived: false,
    isTrash: false,
    images: [],
    imageFiles: [],
  });
  const [modalPosition, setModalPosition] = useState({
    top: "30%",
    left: "50%",
    width: 600,
    height: 185,
    borderRadius: "0.7rem",
    transform: "translate(-50%, -30%)",
    margin: "25px",
  });
  const [isClient, setIsClient] = useState(false);
  const [trigger2, setTrigger2] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [isEmptyNote, setIsEmptyNote] = useState(true);
  const modalRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const modalContainerRef = useRef(null);

  useEffect(() => {
    // Set isClient to true once the component is mounted on the client side
    setIsClient(true);
  }, []);

  const [width, setWidth] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (modalRef.current) {
        setWidth(modalRef.current.offsetWidth);
      }
    });

    if (modalRef.current) {
      observer.observe(modalRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [trigger]);

  useEffect(() => {
    setTimeout(() => {
      setTrigger2(trigger);
    }, 10);
  }, [trigger]);

  useEffect(() => {
    if (trigger2) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      modalRef.current.style.marginLeft = `${0}px`;
      //marginLeft: trigger2? '0px': "5px",
    } else {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = ""; // Remove padding
      if (modalRef.current)
        modalRef.current.style.marginLeft = `${
          scrollbarWidth === 0 ? 0 : scrollbarWidth - 5
        }px`;
    }
    return () => (document.body.style.overflow = "auto"); // Cleanup
  }, [trigger2]);

  if (!isClient) {
    return null; // Return nothing on the server side
  }

  const handleClose = async (e, closeRef) => {
    if (
      modalContainerRef.current === e.target ||
      closeRef?.current === e.target
    ) {
      setTrigger2(false);
      setTimeout(() => {
        setTrigger(false);
      }, 260);

      if (
        note.title.trim() ||
        note.content.trim() ||
        (note.images && note.images.length > 0)
      ) {
        try {
          setIsEmptyNote(false);
          setTimeout(() => {
            const rect = lastAddedNoteRef.current.getBoundingClientRect();
            setModalPosition({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              borderRadius: "0.7rem",
            });
          }, 20);
        } catch (error) {
          console.log("Couldn't fetch note position on add.");
        }

        const newNote = {
          uuid: uuid(),
          title: note.title,
          content: note.content,
          color: note.color,
          labels: note.labels,
          isPinned: note.isPinned,
          isArchived: note.isArchived,
          isTrash: note.isArchived,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: note.images,
        };
        setNotes((prev) => [newNote, ...prev]);
        window.dispatchEvent(new Event("loadingStart"));
        setIsLoadingImages((prev) => [...prev, newNote.uuid]);
        await createNoteAction(newNote);
        await UploadImagesAction(note.imageFiles, newNote.uuid);
        setIsLoadingImages((prev) => prev.filter((id) => id !== newNote.uuid));
        setTimeout(() => {
          window.dispatchEvent(new Event("loadingEnd"));
        }, 800);
      }
      setIsEmptyNote(true);
      titleRef.current.textContent = "";
      contentRef.current.textContent = "";
      setSelectedColor("#FFFFFF");
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const handleTitleInput = (e) => {
    const text = e.target.textContent;
    setNote({ ...note, title: text });
    if (!text) {
      e.target.textContent = "";
    }
  };

  const handleContentInput = (e) => {
    const text = e.target.textContent;
    setNote({ ...note, content: text });
    if (!text) {
      e.target.textContent = "";
    }
  };

  const handlePinClick = () => {
    setNote((prev) => ({ ...prev, isPinned: !prev.isPinned }));
  };

  const UploadImagesAction = async (images, noteUUID) => {
    setModalPosition({
      top: "30%",
      left: "50%",
      width: 600,
      height: 185,
      borderRadius: "0.7rem",
      transform: "translate(-50%, -30%)",
      margin: "25px",
    });
    setNote({
      uuid: "",
      title: "",
      content: "",
      color: "#FFFFFF",
      labels: [],
      isPinned: false,
      isArchived: false,
      isTrash: false,
      images: [],
      imageFiles: [],
    });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
      const bucketName = "notopia";

      for (const image of images) {
        const filePath = `${userID}/${noteUUID}/${image.id}`;
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, image.file, {
            cacheControl: "0",
          });

        if (error) {
          console.error("Error uploading file:", error);
          continue;
        }
      }
    } catch (error) {
      console.log("couldn't upload images", error);
    }
  };

  return createPortal(
    <div
      ref={modalContainerRef}
      onMouseDown={handleClose}
      style={{
        display: trigger ? "" : "none",
        backgroundColor: trigger2 && "rgba(0,0,0,0.5)",
      }}
      className="modal-container"
    >
      <div
        ref={modalRef}
        style={{
          opacity: trigger2 ? "1" : isEmptyNote ? "0" : "1",
          top: modalPosition.top,
          left: modalPosition.left,
          width: modalPosition.width,
          height: trigger2 ? "" : modalPosition.height,
          marginTop: trigger2 ? "0px" : modalPosition.margin,
          minHeight: trigger2 ? "185px" : "",
          transform: modalPosition.transform,
          borderRadius: modalPosition.borderRadius,
          backgroundColor: selectedColor,
          transition:
            "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.1s ease, height 0.1s ease, background-color 0.25s linear, border-radius 0.1s, margin-left 0s",
        }}
        className="modal"
      >
        <div
          style={{ overflowY: trigger2 ? "auto" : "hidden" }}
          className="modal-inputs-container"
        >
          {note.images.length === 0 ||
            (!note.images && <div className="modal-corner" />)}
          <div className="modal-pin">
            <Button
              disabled={!trigger2}
              style={{ opacity: !trigger2 && "0" }}
              onClick={handlePinClick}
            >
              <PinIcon
                color={note.isPinned ? "#212121" : "transparent"}
                opacity={0.8}
                rotation={note.isPinned ? "0deg" : "40deg"}
              />
            </Button>
          </div>
          <div
            style={{
              position: "relative",
              opacity: !trigger2 && note.images.length > 0 ? "0.6" : "1",
            }}
          >
            <NoteImagesLayout width={width} images={note.images} />
            {!trigger2 && note.images.length > 0 && (
              <div className="linear-loader" />
            )}
          </div>
          <div
            style={{
              display: trigger2
                ? ""
                : note.content && !note.title
                ? "none"
                : !note.title && !note.content
                ? "none"
                : "",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleTitleInput}
            onPaste={handlePaste}
            ref={titleRef}
            className={`${
              trigger2 ? "modal-title-input" : "modal-closed-title-input"
            } modal-editable-title`}
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label="Title"
            spellCheck="false"
          />
          <div
            style={{
              display: trigger2
                ? ""
                : !note.content && note.title
                ? "none"
                : !note.title && !note.content
                ? "none"
                : "",
              minHeight: "3.8rem",
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            onPaste={handlePaste}
            ref={contentRef}
            className={`${
              trigger2 ? "modal-content-input" : "modal-closed-content-input"
            } modal-editable-content`}
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label="Take a note...."
            spellCheck="false"
          />
        </div>
        {trigger2 && (
          <ModalTools
            setNote={setNote}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            handleClose={handleClose}
          />
        )}
      </div>
    </div>,
    document.getElementById("modal-portal")
  );
};

export default memo(AddNoteModal);
