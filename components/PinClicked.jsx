import React from "react";

const PinClicked = ({ style, color = "#212121", image, opacity, pinImgDis }) => {
  return (
    <>
      {image ? (
        <svg
          style={{ opacity: opacity, transition: "opacity 0.2s ease", display: pinImgDis }}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_26_2)">
            <g filter="url(#filter0_f_26_2)">
              <path
                d="M12.0289 15C12.0289 15.4602 12 15.9252 12 16.3714C12 16.8481 12 17.3048 12 17.786C12 18.7563 12 19.7481 12 20.7164"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
            <rect x="7" y="4" width="10" height="11" fill="#3c4042" />
            <g filter="url(#filter1_f_26_2)">
              <path
                d="M18.4286 3.3V11.35L21 14.8V17.1H13.2857V22.85L12 24L10.7143 22.85V17.1H3V14.8L5.57143 11.35V3.3C5.57143 2.035 6.72857 1 8.14286 1H15.8571C17.2843 1 18.4286 2.0235 18.4286 3.3ZM8.14286 3.3V12.2125L6.21429 14.8H17.7857L15.8571 12.2125V3.3H8.14286Z"
                fill="#ECF0F1"
              />
            </g>
            <path
              d="M17 4V11L19 14V16H13V21L12 22L11 21V16H5V14L7 11V4C7 2.9 7.9 2 9 2H15C16.11 2 17 2.89 17 4ZM9 4V11.75L7.5 14H16.5L15 11.75V4H9Z"
              fill="#3c4042"
            />
          </g>
          <defs>
            <filter
              id="filter0_f_26_2"
              x="7.9"
              y="10.9"
              width="8.22887"
              height="13.9164"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feGaussianBlur
                stdDeviation="1.3"
                result="effect1_foregroundBlur_26_2"
              />
            </filter>
            <filter
              id="filter1_f_26_2"
              x="1.7"
              y="-0.3"
              width="20.6"
              height="25.6"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feGaussianBlur
                stdDeviation="0.65"
                result="effect1_foregroundBlur_26_2"
              />
            </filter>
            <clipPath id="clip0_26_2">
              <rect width="24" height="24" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ) : (
        <svg
          style={style}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            style={{ transition: "fill 0.2s ease-in, opacity 0.2s ease-in" }}
            fill={color}
            d="M17 4a2 2 0 0 0-2-2H9c-1.1 0-2 .9-2 2v7l-2 3v2h6v5l1 1 1-1v-5h6v-2l-2-3V4z"
          />
        </svg>
      )}
    </>
  );
};

export default PinClicked;
