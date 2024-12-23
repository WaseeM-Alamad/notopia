import { borderRadius } from "@mui/system";
import React, { memo, useRef } from "react";

const Button = ({
  children,
  onClick,
  className,
  ref,
  style 
}) => {
  return <button className={`${className} btn`} ref={ref} onClick={onClick} style={style}>{children}</button>;
};

export default memo(Button);
