import Loader from "components/UI/Loader";
import React, { useState } from "react";
import { useSpring, a, config } from "react-spring";
import Styles from "./AdminTableRow.module.css";

const AdminTableRow = ({ alumni, type, ...rest }) => {
  const [isHovered, setIsHover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const props = useSpring({
    config: config.stiff,
    from: {
      background: "#fff",
    },
    to: {
      background: isHovered ? "#FFFCDC" : "#fff",
    },
  });

  const handleOnApproveAlumni = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await rest.approveAlumniHandler(alumni?.user?._id);
    setIsLoading(false);
  };

  const handleOnRejectAlumni = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await rest.rejectAlumni(alumni?._id);
    setIsLoading(false);
  };


  const handleOnPreviewAlumni = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log(alumni);
    await rest.previewHandler(alumni?.user._id);
    setIsLoading(false);
  };


  const handleOnDeleteAlumni = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await rest.onDeleteAlumni(alumni?.user?._id);
    setIsLoading(false);
  };

  const handleOnGenerateID = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await rest.onGenerateID(alumni?.user?._id);
    setIsLoading(false);
  };

  const handleReapproveAlumni = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await rest.reapproveAlumni(alumni?.user?._id);
    setIsLoading(false);
  };

  console.log(window.location.hostname);

  return (
    <a.tr
      style={props}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => {
        setIsHover(false);
      }}
    >
      <td>{alumni?.user?.registerNumber}</td>
      <td>{alumni?.user?.name}</td>
      <td>{alumni?.user?.department}</td>
      {type === "alumni-details" && (
        <>
          <td>{alumni?.designation}</td>
          <td>{alumni?.organization}</td>
        </>
      )}
      {type === "reject-details" && (
        <>
          <td>{alumni?.designation}</td>
          <td>{alumni?.companyName}</td>
        </>
      )}
      {type === "request-details" && (
        <>
          <td>{alumni?.designation}</td>
          <td>{alumni?.organization}</td>
        </>
      )}

      <td>{alumni?.user?.phoneNumber}</td>
      <td>{alumni?.user?.email}</td>
      <td>{alumni?.user?.city}</td>
      <td>{alumni?.user?.state}</td>
      <td>{alumni?.user?.country}</td>
      <td>{alumni?.user?.graduationLevel}</td>
      <td>
        {alumni?.secondaryCollegeName !== undefined
          ? alumni?.secondaryCollegeName
          : "NA"}
      </td>
      <td>{alumni?.courseName !== undefined ? alumni?.courseName : "NA"}</td>
      <td>{alumni?.user?.skill}</td>

      {type === "alumni-details" && (
        <a.td className={Styles.fixed_col} style={props}>
          <button
            onClick={handleOnDeleteAlumni}
            className={`${Styles.decline}`}
          >
            Delete
          </button>
          {/* <button onClick={handleOnGenerateID} className={`${Styles.accept}`}>
            Generate Card
          </button> */}
          <a
            target="_blank"
            rel="noreferrer"
            href={`http://${window.location.hostname}/api/v1/alumni/generate/${alumni.user._id}`}
          >
            <button>Generate Alumni ID</button>
          </a>
        </a.td>
      )}
      {type === "request-details" &&
        (isLoading ? (
          <Loader />
        ) : (
          <a.td className={Styles.fixed_col} style={props}>
            <button onClick={handleOnApproveAlumni} className={Styles.accept}>
              Accept
            </button>
            <button onClick={handleOnRejectAlumni} className={Styles.decline}>
              Reject
            </button>
            <a
            target="_blank"
            rel="noreferrer"
            href={`http://${window.location.hostname}/api/v1/alumni/generate/${alumni.user._id}`}
          >
            <button>Generate Alumni ID</button>
          </a>
          </a.td>
        ))}
      {type === "reject-details" &&
        (isLoading ? (
          <Loader />
        ) : (
          <a.td className={Styles.fixed_col} style={props}>
            <button className={Styles.accept} onClick={handleReapproveAlumni}>
              Reaccept
            </button>
            <a
              target="_blank"
              rel="noreferrer"
              href={`http://${window.location.hostname}/api/v1/alumni/generate/${alumni.user._id}`}
            >
              <button>Generate Alumni ID</button>
            </a>
          </a.td>
        ))}
    </a.tr>
  );
};

export default AdminTableRow;
