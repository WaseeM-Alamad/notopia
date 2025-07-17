import React, { memo } from "react";

const Button = ({
  children,
  onClick,
  disabled,
  className = "",
  ref,
  style,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`${className} btn`}
      ref={ref}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
};

export default memo(Button);
