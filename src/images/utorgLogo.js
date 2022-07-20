import React from "react";

function IconUtorg(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width || "67"}
      height={props.height || "67"}
      fill="none"
      viewBox="0 0 67 67"
      style={{opacity: props.opacity ? 0.3 : null}}
    >
      <path fill="#fff" d="M0 0H67V67H0z"></path>
      <path
        fill="#000"
        d="M0 33.5V67h67V0H0v33.5zm29.731-2.722c.628 10.469 1.256 12.144 4.816 12.144 3.56 0 4.187-1.675 4.816-12.144.628-10.26 1.256-11.934 4.606-11.934 3.56 0 4.187 1.465 4.187 11.097 0 14.237-3.978 20.309-13.61 20.309-9.63 0-13.608-6.072-13.608-20.31 0-9.63.628-11.096 4.187-11.096 3.35 0 3.978 1.675 4.606 11.934z"
      ></path>
    </svg>
  );
}

export default IconUtorg;
