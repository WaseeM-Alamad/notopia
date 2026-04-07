import React from "react";

const RemindMeLater = ({ setIsOpen, menuItems }) => {
  return (
    <div className="reminder-menu">
      <span style={{ fontSize: ".92rem", padding: "0.3rem .8rem" }}>
        {" "}
        Remind me later
      </span>
      <div className="menu-buttons">
        {menuItems.map((item, index) => {
          if (!item?.title?.trim()) {
            return;
          }
          return (
            <div
              key={index}
              className={`menu-btn n-menu-btn ${item.icon}`}
              style={{
                paddingLeft: "0rem",
                paddingRight: "0rem",
              }}
              onClick={() => {
                if (!item.title.startsWith("Pick")) {
                  setIsOpen(false);
                }
                item.function();
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "4.5rem",
                  width: "100%",
                  padding: "0.2rem .6rem",
                  paddingLeft: item.icon ? "2.2rem" : ".6rem",
                  fontSize: ".83rem"
                }}
              >
                <span>{item.title}</span>
                <span>{item.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RemindMeLater;
