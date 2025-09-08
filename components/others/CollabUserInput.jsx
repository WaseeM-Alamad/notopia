import React, { useState } from "react";
import Button from "../Tools/Button";
import { head, transform } from "lodash";
import { useAppContext } from "@/context/AppContext";

const CollabUserInput = () => {
  const { showTooltip, hideTooltip } = useAppContext();
  const [input, setInput] = useState("");

  return (
    <div className="collab-user">
      <div className="collab-user-img" />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "0.9rem",
          width: "100%",
          position: "relative",
        }}
      >
        <input
          type="text"
          name="collab-input"
          onInput={(e) => setInput(e.target.value)}
          placeholder="Username or email to share with"
          className="collab-input"
        />
        {input.trim() && (
          <Button
            onMouseEnter={(e) => showTooltip(e, "Add collaborator")}
            onMouseLeave={hideTooltip}
            className="small-btn check-icon"
          />
        )}
      </div>
    </div>
  );
};

export default CollabUserInput;
