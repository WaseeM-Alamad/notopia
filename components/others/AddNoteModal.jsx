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
  dispatchNotes,
  lastAddedNoteRef,
  setIsLoadingImages,
  setTooltipAnchor,
  openSnackFunction,
}) => {
  const { data: session } = useSession();
  const userID = session?.user?.id;
  const [note, setNote] = useState({
    uuid: "",
    title: "",
    content: "",
    color: "Default",
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
  const [trigger, setTrigger] = useState(false);
  const [trigger2, setTrigger2] = useState(false);
  const [selectedColor, setSelectedColor] = useState("Default");
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
    if (!trigger) {
      setIsEmptyNote(true);
      if (titleRef.current) titleRef.current.textContent = "";
      if (contentRef.current) contentRef.current.textContent = "";
      setSelectedColor("Default");
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
        color: "Default",
        labels: [],
        isPinned: false,
        isArchived: false,
        isTrash: false,
        images: [],
        imageFiles: [],
      });
    }

    const handler = () => {
      if (!trigger) setTrigger(true);
    };

    window.addEventListener("openModal", handler);
  }, [trigger]);

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
    const nav = document.querySelector("nav");
    if (trigger2) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      modalRef.current.style.marginLeft = `${0}px`;
      if (nav) nav.style.marginLeft = `${-scrollbarWidth}px`;
      if (nav) nav.style.paddingLeft = `${scrollbarWidth}px`;
    } else {
      openSnackFunction({ close: true });
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = ""; // Remove padding
      if (modalRef.current)
        modalRef.current.style.marginLeft = `${
          scrollbarWidth === 0 ? 0 : scrollbarWidth - 5
        }px`;
      if (nav) nav.style.marginLeft = "0px";
      if (nav) nav.style.paddingLeft = "0px";
    }
    return () => (document.body.style.overflow = "auto"); // Cleanup
  }, [trigger2]);

  if (!isClient) {
    return null; // Return nothing on the server side
  }

  const handleClose = async (e, closeRef) => {
    if (
      (modalContainerRef.current === e.target ||
        closeRef?.current === e.target) &&
      trigger2
    ) {
      setTrigger2(false);

      setTimeout(() => {
        setTrigger(false);
        lastAddedNoteRef.current.style.opacity = "1";
      }, 260);

      if (
        note.title.trim() ||
        note.content.trim() ||
        (note.images && note.images.length > 0)
      ) {
        try {
          setTimeout(() => {
            lastAddedNoteRef.current.style.opacity = "0";
          }, 10);
          setIsEmptyNote(false);
          setTimeout(() => {
            if (!note.isArchived) {
              const rect = lastAddedNoteRef.current.getBoundingClientRect();
              setModalPosition({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                borderRadius: "0.7rem",
              });
            }
          }, 20);
        } catch (error) {
          console.log("Couldn't fetch note position on add.");
        }

        const newUUID = uuid();

        const newNote = {
          uuid: newUUID,
          title: note.title,
          content: note.content,
          color: note.color,
          labels: note.labels,
          isPinned: note.isPinned,
          isArchived: note.isArchived,
          isTrash: note.isTrash,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: note.images,
        };
        dispatchNotes({
          type: "ADD_NOTE",
          newNote: newNote,
        });
        window.dispatchEvent(new Event("loadingStart"));
        if (newNote.images.length > 0) {
          setIsLoadingImages((prev) => [...prev, newNote.uuid]);
        }
        await createNoteAction(newNote);
        await UploadImagesAction(note.imageFiles, newNote.uuid);
        if (newNote.images.length > 0) {
          setIsLoadingImages((prev) =>
            prev.filter((uuid) => uuid !== newNote.uuid)
          );
        }
        window.dispatchEvent(new Event("loadingEnd"));
      }
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
    closeToolTip();
    setNote((prev) => ({ ...prev, isPinned: !prev.isPinned }));
  };

  const UploadImagesAction = async (images, noteUUID) => {
    if (images.length === 0) return;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
      const bucketName = "notopia";

      for (const image of images) {
        const filePath = `${userID}/${noteUUID}/${image.uuid}`;
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

  const insert = async () => {
    for (let i = 0; i < 50; i++) {
      const newNote = {
        uuid: uuid(),
        title: note.title,
        content: note.content,
        color: note.color,
        labels: note.labels,
        isPinned: note.isPinned,
        isArchived: note.isArchived,
        isTrash: note.isTrash,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: note.images,
      };
      createNoteAction(newNote);
    }
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
      text: prev.text,
    }));
  };

  const AddNoteImageDelete = (imageUUID, imageURL) => {
    const imageObject = { url: imageURL, uuid: imageUUID };
    let imageFileObject;
    let imageIndex;

    setNote((restOfNote) => {
      const filteredImages = restOfNote.images.reduce((acc, image, index) => {
        if (image.uuid === imageUUID) {
          imageIndex = index;
          return acc;
        }

        acc.push(image);
        return acc;
      }, []);
      return { ...restOfNote, images: filteredImages };
    });

    setNote((restOfNote) => {
      const filteredImageFiles = restOfNote.imageFiles.reduce(
        (acc, imageFile, index) => {
          if (imageFile.uuid === imageUUID) {
            imageFileObject = { file: imageFile.file, uuid: imageUUID };
            return acc;
          }
          acc.push(imageFile);
          return acc;
        },
        []
      );
      return { ...restOfNote, imageFiles: filteredImageFiles };
    });

    const undo = () => {
      setNote((restOfNote) => {
        const updatedImages = [...restOfNote.images];
        updatedImages.splice(imageIndex, 0, imageObject);

        return {
          ...restOfNote,
          images: updatedImages,
          imageFiles: [...restOfNote.imageFiles, imageFileObject],
        };
      });
    };

    openSnackFunction({ snackMessage: "Image deleted", snackOnUndo: undo });
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
      <button onClick={insert}>insertff</button>
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
          transition:
            "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.1s ease, height 0.1s ease, background-color 0.25s linear, border-radius 0.1s, margin-left 0s, max-height 0s",
        }}
        className={`modal ${note.color} `}
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
              onMouseEnter={(e) =>
                handleMouseEnter(e, `${note.isPinned ? "Unpin" : "Pin"}`)
              }
              onMouseLeave={handleMouseLeave}
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
            <NoteImagesLayout
              width={width}
              images={note.images}
              deleteSource="AddModal"
              AddNoteImageDelete={AddNoteImageDelete}
              modalOpen={trigger2}
            />
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
              trigger2
                ? "modal-title-input"
                : note.isArchived
                ? "modal-title-input"
                : "modal-closed-title-input"
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
              trigger2
                ? "modal-content-input"
                : note.isArchived
                ? "modal-content-input"
                : "modal-closed-content-input"
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
            note={note}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            setTooltipAnchor={setTooltipAnchor}
            handleClose={handleClose}
            openSnackFunction={openSnackFunction}
          />
        )}
      </div>
    </div>,
    document.getElementById("modal-portal")
  );
};

export default memo(AddNoteModal);
