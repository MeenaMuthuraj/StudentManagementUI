import React from "react";

const Button = ({ text, color }) => {
  return (
    <button className={`px-6 py-3 rounded-full font-bold ${color}`}>{text}</button>
  );
};

export default Button;