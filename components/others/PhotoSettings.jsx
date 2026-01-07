import React, { memo, useState } from "react";
import GalleryCarousel from "./GalleryCarousel";
import { AnimatePresence } from "framer-motion";
import SetAvatarModal from "./SetAvatarModal";

const PhotoSettings = ({ rightHeader, selected, user }) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
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
                // onClick={() => setIsCropOpen(true)}
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
            images={[{ url: user.image }]}
            setIsOpen={setIsImageOpen}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCropOpen && (
          <SetAvatarModal isOpen={isCropOpen} setIsOpen={setIsCropOpen} />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(PhotoSettings);
