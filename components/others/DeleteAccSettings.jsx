import React, { memo } from "react";

const DeleteAccSettings = ({ rightHeader, selected }) => {
  return (
    <div style={{ display: !selected && "none" }} className="setting-wrapper">
      <div className="settings-right-title">{rightHeader().title}</div>
      <div className="settings-right-desc">{rightHeader().desc}</div>
      <div className="settings-delete-account">
        <div style={{ display: "flex", gap: "1rem" }}>
          <div className="red-trash-icon" />
          <div className="delete-acc-info">
            <div
              style={{
                color: "rgb(127 29 29)",
                marginBottom: ".8rem",
                fontWeight: "500",
              }}
            >
              This action cannot be undone
            </div>
            <div
              style={{
                color: "rgb(185, 28, 28)",
                marginBottom: ".8rem",
                fontSize: "0.875rem",
              }}
            >
              Deleting your account will permanently remove all your data,
              including your notes, media, and any other information
              associated with your account. This action is irreversible.
            </div>

            <ul
              style={{
                color: "rgb(185, 28, 28)",
                marginBottom: "1.3rem",
                fontSize: "0.875rem",
                listStyle: "none",
              }}
            >
              <li>• All your notes and labels will be deleted</li>
              <li>• Your profile information will be permanently removed</li>
              <li>• This action cannot be undone</li>
            </ul>

            <div className="del-acc-btn"> Delete My Account </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DeleteAccSettings);
