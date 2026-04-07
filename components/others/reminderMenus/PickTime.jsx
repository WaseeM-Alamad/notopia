import BackIcon from "@/components/icons/BackIcon";
import InputLeftArrow from "@/components/icons/InputLeftArrow";
import Button from "@/components/Tools/Button";
import React from "react";
import Select from "../Select";

const PickTime = ({ setIsPickSection, setIsOpen }) => {
  return (
    <div className="pick-time-container">
      <div className="pick-time-top">
        <Button
          style={{ width: "28px", height: "28px" }}
          onClick={() => setIsPickSection(false)}
        >
          <InputLeftArrow size={19} />
        </Button>
        <span style={{ fontSize: ".88rem" }}>Pick date & time</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
        <Select />
        <Select />
        <Select />
      </div>
      <div
        className="modal-bottom-btn"
        style={{
          fontSize: ".8rem",
          padding: "0.4rem 1rem",
          alignSelf: "end",
          marginRight: ".9rem",
          marginTop: ".5rem",
          width: "fit-content",
          height: "unset",
          minHeight: "unset",
          fontWeight: "500",
        }}
        onClick={() => setIsOpen(false)}
      >
        Save
      </div>
    </div>
  );
};

export default PickTime;
