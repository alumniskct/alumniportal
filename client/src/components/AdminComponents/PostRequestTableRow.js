import { useAlertContext } from "context/alert/alertContext";
import React, { useState } from "react";
import { GrClose } from "react-icons/gr";
import { IoIosArrowDown, IoIosSend } from "react-icons/io";
import { IoEyeOffSharp, IoEyeSharp } from "react-icons/io5";
import styles from "./PostRequestTableRow.module.css";

const ImageOverlay = ({ data, setIsShowImage }) => {
  return (
    <div className={styles.overlay} onClick={() => setIsShowImage(false)}>
      <img
        src={`http://localhost:8000/api/v1/forum/image/${data.postData.post.images[0]}`}
        alt="post-image"
        onClick={(e) => e.stopPropagation()}
      />
      <GrClose
        className={styles.close_btn}
        onClick={() => setIsShowImage(false)}
      />
    </div>
  );
};

const DescOverlay = ({ data, setIsShowDesc }) => {
  return (
    <div className={styles.overlay} onClick={() => setIsShowDesc(false)}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h4>Description</h4>
          <GrClose
            className={styles.close_btn}
            onClick={() => setIsShowDesc(false)}
          />
        </div>
        <hr />
        <p>{data.postData.post.desc}</p>
      </div>
    </div>
  );
};

const RejectReasonOverlay = ({ setIsShowReject }) => {
  const [reason, setReason] = useState("");
  const handleSent = () => {
    console.log(reason);
    setReason("");
    setIsShowReject(false);
  };
  return (
    <div className={styles.overlay} onClick={() => setIsShowReject(false)}>
      <div
        className={`${styles.container} ${styles.reason}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3>Reason</h3>
          <GrClose
            className={styles.close_btn}
            onClick={() => setIsShowReject(false)}
          />
        </div>
        <div className={styles.input_container}>
          <span
            class={styles.textarea}
            role="textbox"
            contentEditable={true}
            suppressContentEditableWarning={true}
            onBlur={(e) => setReason(e.currentTarget.textContent)}
          >
            {reason}
          </span>
          <IoIosSend
            font-size={30}
            className={styles.send_btn}
            onClick={handleSent}
          />
        </div>
      </div>
    </div>
  );
};

function PostRequestTableRow({ data, onApproveHandler }) {
  const [isShowImage, setIsShowImage] = useState(false);
  const [isShowDesc, setIsShowDesc] = useState(false);
  const [isShowReject, setIsShowReject] = useState(false);
  const handleEyeClick = () => {
    setIsShowImage(!isShowImage);
  };
  const { success } = useAlertContext();

  return (
    <tr className={styles.post_request_row}>
      <td>{data.user.registerNumber}</td>
      <td>{data.user.name}</td>
      <td>{data.postData.post.title}</td>
      <td className={styles.post_desc}>
        <p>{data.postData.post.desc}</p>
        <IoIosArrowDown
          className={styles.arrow_btn}
          onClick={() => setIsShowDesc(!isShowDesc)}
        />
      </td>

      <td className={styles.post_img_eye_btn}>
        {isShowImage ? (
          <IoEyeSharp fontSize={20} onClick={handleEyeClick} />
        ) : (
          <IoEyeOffSharp fontSize={20} onClick={handleEyeClick} />
        )}
      </td>

      <td className={styles.actions}>
        {!data.postData.isApproved ? (
          <>
            <p
              onClick={() => {
                onApproveHandler(data._id);
                success("Approved");
              }}
              className={styles.accept}
            >
              Approve
            </p>
            <p className={styles.decline} onClick={() => setIsShowReject(true)}>
              Decline
            </p>
          </>
        ) : (
          `Approved by ${data.approvedBy.name}`
        )}
        {isShowImage && (
          <ImageOverlay data={data} setIsShowImage={setIsShowImage} />
        )}
        {isShowDesc && (
          <DescOverlay data={data} setIsShowDesc={setIsShowDesc} />
        )}
        {isShowReject && (
          <RejectReasonOverlay setIsShowReject={setIsShowReject} />
        )}
      </td>
    </tr>
  );
}

export default PostRequestTableRow;
