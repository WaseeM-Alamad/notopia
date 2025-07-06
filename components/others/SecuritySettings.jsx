import React from "react";

const SecuritySettings = ({ rightHeader, selected }) => {
  return (
    <div style={{ display: !selected && "none" }} className="setting-wrapper">
      <div className="settings-right-title">{rightHeader().title}</div>
      <div className="settings-right-desc">{rightHeader().desc}</div>
      <div className="settings-security">
        <div>
          <label className="form-label">Current Password</label>
          <input
            placeholder="Enter current password"
            type="password"
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">New Password</label>
          <input
            placeholder="Enter new password"
            type="password"
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Confirm New Password</label>
          <input
            placeholder="Confirm new password"
            type="password"
            className="form-input"
          />
        </div>
      </div>
      <div style={{marginTop: "1.5rem"}} className="form-input-desc">
        Password should be at least 8 characters long and include a mix of
        letters, numbers, and symbols.
      </div>
    </div>
  );
};

export default SecuritySettings;
