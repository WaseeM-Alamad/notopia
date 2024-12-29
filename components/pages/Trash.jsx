import React from "react";
import TrashIcon from "../icons/TrashIcon";

const Trash = () => {
  return (
    <div className="starting-div">
      <div className="page-header">
        <TrashIcon size={25} color="#212121" />
        <h1 className="page-header-title">Trash</h1>
        <div className="page-header-divider" />
      </div>
    </div>
  );
};

export default Trash;
