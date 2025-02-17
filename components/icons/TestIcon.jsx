import React from "react";

const TestIcon = ({ color = "#212121", size = "30", style = {} }) => {
  return (
    <svg
      style={style}
      width={size}
      height={size}
      viewBox="0 0 53 53"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M43.4306 53C48.7155 53 53 48.7156 53 43.4306L53 23.5556L39.0139 23.5556C33.7289 23.5556 29.4444 19.2711 29.4444 13.9861L29.4444 1.3113e-06L9.56944 1.3113e-06C4.28437 1.3113e-06 0 4.28446 0 9.56945L0 43.4306C0 48.7156 4.28437 53 9.56944 53L43.4306 53ZM51.7044 19.1389L33.8611 1.29556L33.8611 13.9861C33.8611 16.8319 36.1681 19.1389 39.0139 19.1389L51.7044 19.1389Z"
        fill={color}
        style={{transition: "fill 0.25s ease-in-out",}}
      />
    </svg>
  );
};

export default TestIcon;
