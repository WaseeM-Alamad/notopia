import React from "react";

const AccountSettings = ({ rightHeader, selected, user }) => {
  return (
    <div style={{ display: !selected && "none" }} className="setting-wrapper">
      <div className="settings-right-title">{rightHeader().title}</div>
      <div className="settings-right-desc">{rightHeader().desc}</div>
      <div className="account-info-settings">
        <div>
          <label className="form-label">Username</label>
          <input defaultValue={user.name} type="text" className="form-input" />
          <div className="form-input-desc">
            Your non-unique username on the platform.
          </div>
        </div>
        <div>
          <label className="form-label">Email</label>
          <input
            defaultValue={user.email}
            type="text"
            className="form-input"
          />
          <div className="form-input-desc">
            Email that's associated with your account and its data
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
