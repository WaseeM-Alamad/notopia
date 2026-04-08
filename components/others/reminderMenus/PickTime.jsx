import BackIcon from "@/components/icons/BackIcon";
import InputLeftArrow from "@/components/icons/InputLeftArrow";
import Button from "@/components/Tools/Button";
import React, { useState } from "react";
import Select from "../Select";
import { useAppContext } from "@/context/AppContext";

const reps = ["Does not repeat", "Daily", "Weekly", "Monthly", "Yearly"];
const time = [
  { value: "morning", label: "Morning", sideText: "8:00 AM" },
  { value: "afternoon", label: "Afternoon", sideText: "1:00 PM" },
  { value: "evening", label: "Evening", sideText: "6:00 PM" },
  { value: "night", label: "Night", sideText: "8:00 PM" },
  { value: "all day", label: "All day" },
  { value: "custom", label: "Custom" },
];

const PickTime = ({ setIsPickSection, setIsOpen }) => {
  const { showTooltip, hideTooltip } = useAppContext();
  const [selectedRep, setSelectedRep] = useState(reps[0]);
  const [selectedTime, setSelectedTime] = useState(time[0].value);

  return (
    <div className="pick-time-container">
      <div className="pick-time-top">
        <Button
          onMouseEnter={(e) => showTooltip(e, "Go back")}
          onMouseLeave={hideTooltip}
          onFocus={(e) => showTooltip(e, "Remind me")}
          style={{ width: "28px", height: "28px" }}
          onClick={() => setIsPickSection(false)}
        >
          <InputLeftArrow size={19} />
        </Button>
        <span style={{ fontSize: ".88rem" }}>Pick date & time</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
        {/* <Select /> */}
        <Select
          options={time}
          value={selectedTime}
          onChange={setSelectedTime}
          useSideTextforInput={true}
        />
        <Select options={reps} value={selectedRep} onChange={setSelectedRep} />
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
