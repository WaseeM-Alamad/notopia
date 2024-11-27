import React from 'react';

const ListIcon = ({ size = 24, color = 'currentColor' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="19" height="7" rx="1" ry="1" />
        <rect x="3" y="14" width="19" height="7" rx="1" ry="1" />
    </svg>
);

export default ListIcon;