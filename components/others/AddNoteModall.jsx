import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../Tools/Button";
import PinIcon from "../icons/PinIcon";
import NoteImagesLayout from "../Tools/NoteImagesLayout";
import { v4 as uuid } from "uuid";
import { createNoteAction } from "@/utils/actions";
import { createClient } from "@supabase/supabase-js";
import AddModalTools from "./AddModalTools";
import { debounce } from "lodash";

const AddNoteModall = ({
  dispatchNotes,
  setTooltipAnchor,
  containerRef,
  lastAddedNoteRef,
  openSnackFunction,
}) => {
  const { data: session } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const userID = session?.user?.id;
  const [note, setNote] = useState({
    uuid: "",
    title: "",
    content: "",
    color: "Default",
    labels: [],
    checkboxes: [],
    showCheckboxes: true,
    expandCompleted: true,
    isPinned: false,
    isArchived: false,
    isTrash: false,
    images: [],
    imageFiles: [],
  });
  const [selectedColor, setSelectedColor] = useState("Default");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const modalRef = useRef(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (titleRef.current) titleRef.current.textContent = "";
    if (contentRef.current) contentRef.current.textContent = "";

    // setSelectedColor("Default");
  }, [isOpen]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handler = () => {
      setIsOpen2(true);
      setIsOpen(true);
    };

    window.addEventListener("openModal", handler);
    return () => window.removeEventListener("openModal", handler);
  }, []);

  const centerModal = () => {
    requestAnimationFrame(() => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;

      const topPos = (viewportHeight - modalHeight) / 3;

      modalRef.current.style.transform = "none";
      modalRef.current.style.left = `${(viewportWidth - modalWidth) / 2}px`;
      modalRef.current.style.top = `${topPos > 30 ? topPos : 30}px`;
    });
  };

  const positionModal = (rect) => {
    modalRef.current.style.left = `${rect.left}px`;
    modalRef.current.style.top = `${rect.top}px`;
    const scale = `scale(${rect.width / modalRef.current.offsetWidth}, ${
      rect.height / modalRef.current.offsetHeight
    } )`;
    modalRef.current.style.transform = scale;
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

  const handleCreateNote = async () => {
    const newUUID = uuid();

    const newNote = {
      uuid: newUUID,
      title: note.title,
      content: note.content,
      color: note.color,
      labels: note.labels,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      checkboxes: note.checkboxes,
      showCheckboxes: note.showCheckboxes,
      expandCompleted: note.expandCompleted,
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

    await createNoteAction(newNote);
    await UploadImagesAction(note.imageFiles, newNote.uuid);
    window.dispatchEvent(new Event("loadingEnd"));
  };

  const reset = () => {
    setSelectedColor("Default");
    setNote({
      uuid: "",
      title: "",
      content: "",
      color: "Default",
      labels: [],
      checkboxes: [],
      showCheckboxes: true,
      expandCompleted: true,
      isPinned: false,
      isArchived: false,
      isTrash: false,
      images: [],
      imageFiles: [],
    });
    setRedoStack([]);
    setUndoStack([]);
  };

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", centerModal);
    return () => window.removeEventListener("resize", centerModal);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const observer = new ResizeObserver(() => centerModal());
    if (modalRef.current) observer.observe(modalRef.current);

    centerModal();

    return () => observer.disconnect();
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.id === "n-overlay") {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    const nav = document.querySelector("nav");
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      if (nav) nav.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "";
      if (nav) nav.style.paddingRight = "0px";
    }
  }, [isOpen]);

  useEffect(() => {
    if (!modalRef.current || !isOpen2) return;
    const overlay = document.getElementById("n-overlay");
    if (isOpen) {
      modalRef.current.style.display = "flex";
      centerModal();

      modalRef.current.style.opacity = 0;
      modalRef.current.style.marginTop = "-8px";
      modalRef.current.style.transition =
        "all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), left 0s, top .13s, background-color 0.25s ease-in-out";
      modalRef.current.offsetHeight;
      modalRef.current.style.opacity = "1";
      modalRef.current.style.marginTop = "0px";

      overlay.style.display = "block";
      overlay.offsetHeight;
      overlay.style.opacity = "1";
    } else {
      setIsOpen2(false);
      overlay.style.opacity = "0";
      modalRef.current.style.transition =
        "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)";

      const noteEmpty =
        !note.title && !note.content && note.images.length === 0;

      if (noteEmpty) {
        modalRef.current.style.marginTop = "-8px";
        modalRef.current.style.opacity = "0";

        const handler = (e) => {
          if (e.propertyName === "margin-top") {
            modalRef.current.removeEventListener("transitionend", handler);
            modalRef.current.removeAttribute("style");
            overlay.removeAttribute("style");
            reset();
          }
        };

        modalRef.current.removeEventListener("transitionend", handler);
        modalRef.current.addEventListener("transitionend", handler);
      } else {
        handleCreateNote();

        const observer = new MutationObserver(() => {
          const lastNote = lastAddedNoteRef.current;
          if (!lastNote) return;
          requestAnimationFrame(() => {
            const rect = lastNote.getBoundingClientRect();
            positionModal(rect);
            lastNote.style.opacity = "0";
          });
          observer.disconnect(); // Clean up after firing once
        });

        // Observe the notes container
        observer.observe(containerRef.current, {
          childList: true,
          subtree: false,
        });

        const handler = (e) => {
          if (e.propertyName === "left") {
            modalRef.current.removeEventListener("transitionend", handler);
            requestAnimationFrame(() => {
              const lastNote = lastAddedNoteRef.current;
              modalRef.current.removeAttribute("style");
              overlay.removeAttribute("style");
              lastNote.style.removeProperty("opacity");
              reset();
            });
          }
        };

        modalRef.current.removeEventListener("transitionend", handler);
        modalRef.current.addEventListener("transitionend", handler);
      }
    }
  }, [isOpen]);

  const handlePinClick = () => {
    // closeToolTip();
    setNote((prev) => ({ ...prev, isPinned: !prev.isPinned }));
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

  const titleDebouncedSetUndo = useCallback(
    debounce((data) => {
      setUndoStack((prev) => [...prev, data]);
    }, 120),
    []
  );

  const contentDebouncedSetUndo = useCallback(
    debounce((data) => {
      setUndoStack((prev) => [...prev, data]);
    }, 100),
    []
  );

  const handleUndo = async () => {
    if (undoStack.length === 1) {
      setRedoStack((prev) => [...prev, undoStack[0]]);
      setUndoStack([]);
      titleRef.current.innerText = "";
      contentRef.current.innerText = "";
      setNote((prev) => ({ ...prev, title: "", content: "" }));
    } else {
      const redoItem = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [...prev, redoItem]);
      const updatedStack = undoStack.slice(0, -1);
      setUndoStack(updatedStack);
      const undoItem = updatedStack[updatedStack.length - 1];

      titleRef.current.innerText = undoItem.title;
      contentRef.current.innerText = undoItem.content;
      setNote((prev) => ({
        ...prev,
        title: undoItem.title,
        content: undoItem.content,
      }));
    }
  };

  const handleRedo = async () => {
    const undoItem = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, undoItem]);
    setRedoStack((prev) => prev.slice(0, -1));
    const redoItem = redoStack[redoStack.length - 1];

    titleRef.current.innerText = redoItem.title;
    contentRef.current.innerText = redoItem.content;

    setNote((prev) => ({
      ...prev,
      title: redoItem.title,
      content: redoItem.content,
    }));
  };

  const handleTitleInput = (e) => {
    const text = e.target.textContent;
    const t = text === "\n" ? "" : text;
    setRedoStack([]);
    titleDebouncedSetUndo({ title: t, content: contentRef.current.innerText });
    setNote({ ...note, title: t });
    if (text === "\n") {
      e.target.innerText = "";
    }
  };

  const handleContentInput = (e) => {
    const text = e.target.textContent;
    const t = text === "\n" ? "" : text;
    setRedoStack([]);
    contentDebouncedSetUndo({ title: titleRef.current.innerText, content: t });
    setNote({ ...note, content: t });
    if (text === "\n") {
      e.target.innerText = "";
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");
    // Insert only the text at cursor position
    document.execCommand("insertText", false, text);
  };

  const insert = async () => {
    for (let i = 0; i < 20; i++) {
      const newNote = {
        uuid: uuid(),
        title: note.title,
        content: note.content,
        color: note.color,
        background: "DefaultBG",
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

  if (!isClient) return;

  return createPortal(
    <>
      <div
        ref={modalRef}
        className={[
          "add-modal",
          selectedColor,
          isOpen && "modal-shadow",
          selectedColor === "Default" ? "default-border" : "transparent-border",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* <button onClick={insert}>insert</button> */}
        <div
          style={{ overflowY: !isOpen && "hidden" }}
          className="modal-inputs-container"
        >
          {note.images.length === 0 ||
            (!note.images && <div className="modal-corner" />)}
          <div style={{ opacity: !isOpen && "0" }} className="modal-pin">
            <Button onClick={handlePinClick} disabled={!isOpen}>
              <PinIcon
                isPinned={note.isPinned}
                opacity={0.8}
                rotation={note.isPinned ? "-45deg" : "-5deg"}
                images={note.images.length !== 0}
              />
            </Button>
          </div>
          <div
            style={{
              position: "relative",
              transition: "all 0.2s ease",
              opacity: isOpen ? "1" : "0.15",
            }}
          >
            <NoteImagesLayout
              images={note.images}
              deleteSource="AddModal"
              AddNoteImageDelete={AddNoteImageDelete}
              modalOpen={isOpen}
            />
            {/* {!isOpen && note.images.length > 0 && (
              <div className="linear-loader" />
            )} */}
          </div>
          <div
            style={{
              opacity: isOpen
                ? "1"
                : note.content && !note.title
                ? "0"
                : !note.title && !note.content
                ? "0"
                : "1",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleTitleInput}
            onPaste={handlePaste}
            ref={titleRef}
            className="
               modal-title-input modal-editable-title"
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label="Title"
            spellCheck="false"
          />
          <div
            style={{
              opacity: isOpen
                ? "1"
                : !note.content && note.title
                ? "0"
                : !note.title && !note.content
                ? "0"
                : "1",
              minHeight: "30px",
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            onPaste={handlePaste}
            ref={contentRef}
            className={`${"modal-content-input"} modal-editable-content`}
            role="textbox"
            tabIndex="0"
            aria-multiline="true"
            aria-label="Note"
            spellCheck="false"
          />
        </div>
        <AddModalTools
          setIsOpen={setIsOpen}
          setNote={setNote}
          note={note}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          setTooltipAnchor={setTooltipAnchor}
          openSnackFunction={openSnackFunction}
          redoStack={redoStack}
          undoStack={undoStack}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
        />
      </div>
    </>,
    document.getElementById("modal-portal")
  );
};

export default AddNoteModall;
