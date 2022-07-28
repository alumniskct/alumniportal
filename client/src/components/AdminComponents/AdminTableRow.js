import React, { useState } from "react";
import { useSpring, a, config } from "react-spring";
import Styles from "./AdminTableRow.module.css";
const AdminTableRow = ({ roll }) => {
  const [isHovered, setIsHover] = useState(false);
  const props = useSpring({
    config: config.stiff,
    from: {
      background: "#fff",
    },
    to: {
      background: isHovered ? "#FFFCDC" : "#fff",
    },
  });

  return (
    <a.tr
      style={props}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => {
        setIsHover(false);
      }}
    >
      <td>20TUIT0{roll}</td>
      <td>Yolo Ramesh</td>
      <td>Computer Science</td>
      <td>Software Engineer</td>
      <td>Jumpack Co</td>
      <td>7878789898</td>
      <td>yr12j2@gmail.com</td>

      <a.tr style={props}
        onMouseOver={() => setIsHover(true)}
        onMouseOut={() => {
          setIsHover(false);
        }} className={Styles.fixed_col}>
        <td >Accept/Decline</td>
      </a.tr>
    </a.tr>
  );
};

export default AdminTableRow;
