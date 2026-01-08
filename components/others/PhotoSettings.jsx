import React, { memo, useRef, useState } from "react";
import GalleryCarousel from "./GalleryCarousel";
import { AnimatePresence } from "framer-motion";
import SetAvatarModal from "./SetAvatarModal";
import { validateImageFile } from "@/utils/validateImage";
import { useAppContext } from "@/context/AppContext";
import { validateAvatarImageFile } from "@/utils/validateAvatar";

const PhotoSettings = ({ rightHeader, selected, user }) => {
  const { openSnackRef } = useAppContext();
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isGif, setIsGif] = useState(false);
  const localFileRef = useRef(null);
  const inputRef = useRef(null);

  const handleOnChange = async (e) => {
    e.stopPropagation();
    const imageFile = e.target?.files[0];
    setIsGif(imageFile?.type === "image/gif");
    inputRef.current.value = "";

    const { valid } = await validateAvatarImageFile(imageFile);

    if (!valid) {
      openSnackRef.current({
        snackMessage:
          "Can’t upload this image. Please choose a GIF, JPEG, JPG, or PNG under 5MB and at least 400×400 pixels.",
        showUndo: false,
      });
      return;
    }

    localFileRef.current = imageFile;
    setIsCropOpen(true);
  };

  return (
    <>
      <div style={{ display: !selected && "none" }} className="setting-wrapper">
        <div className="settings-right-title">{rightHeader().title}</div>
        <div className="settings-right-desc">{rightHeader().desc}</div>
        <div className="upload-avatar-container">
          <div
            onClick={() => setIsImageOpen(true)}
            className="settings-img-container"
          >
            <div className="acc-img-hv" />
            <img src={user.image} alt="profile-image" />
          </div>
          <div className="settings-img-desc">
            <div style={{ fontWeight: "510", marginBottom: "0.5rem" }}>
              Change Profile Photo
            </div>
            <div
              className="settings-right-desc"
              style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}
            >
              Click the camera icon to upload a new photo. Recommended size is
              400x400 pixels.
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.6rem",
                justifyContent: "end",
                flexWrap: "wrap",
              }}
            >
              <div
                className="settings-image-btn"
                onClick={() => {
                  inputRef.current.click();
                }}
              >
                Upload New Photo
              </div>
              <div className="settings-image-btn warning-color">
                Remove Image
              </div>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isImageOpen && (
          <GalleryCarousel
            isAvatar={true}
            images={[{ url: user.image }]}
            setIsOpen={setIsImageOpen}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCropOpen && (
          <SetAvatarModal
            isOpen={isCropOpen}
            setIsOpen={setIsCropOpen}
            initialFileRef={localFileRef}
            isGif={isGif}
          />
        )}
      </AnimatePresence>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleOnChange}
      />
    </>
  );
};

export default memo(PhotoSettings);
