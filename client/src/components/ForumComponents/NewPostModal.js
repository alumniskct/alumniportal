import React, { useEffect, useState } from "react";
import ReactPortal from "components/Modal/ReactPortal";
import { IoClose } from "react-icons/io5";
import { BiImageAdd } from "react-icons/bi";
import styles from "./NewPostModal.module.css";
import { GiPin } from "react-icons/gi";
import { useAuthContext } from "context/auth/authContext";
import useAxiosWithCallback from "hooks/useAxiosWithCallback";
import Loader from "components/UI/Loader";
import { useAlertContext } from "context/alert/alertContext";

function NewPostModal({ setNewPostActive }) {
  const [imageSwitch, setImageSwitch] = useState(false);
  const [showError, setShowError] = useState(false);
  const [postData, setPostData] = useState({
    cname: "",
    designation: "",
    title: "",
    description: "",
    image: undefined,
  });
  const { user } = useAuthContext();
  const { fetchData: createPost, error, isLoading } = useAxiosWithCallback();
  const { successAlert, errorAlert } = useAlertContext();
  const onSelectFile = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setPostData({
        ...postData,
        image: postData.image || undefined,
      });
      return;
    }
    setPostData({
      ...postData,
      image: e.target.files[0],
    });
  };

  useEffect(() => {
    const closeOnEscapeKey = (e) =>
      e.key === "Escape" ? setNewPostActive(false) : null;
    document.body.addEventListener("keydown", closeOnEscapeKey);
    return () => {
      document.body.removeEventListener("keydown", closeOnEscapeKey);
    };
  }, [setNewPostActive]);

  useEffect(() => {
    if (error) errorAlert(error?.response?.data?.message);
  }, [error, errorAlert]);

  const handleMouseEnter = () => {
    setImageSwitch(true);
  };

  const handleMouseLeave = () => {
    setImageSwitch(false);
  };

  const handleChange = (e) => {
    setPostData({
      ...postData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (postData.image === undefined) {
      setShowError(true);
    }
    const postFormData = new FormData();

    postFormData.append("title", postData.title);
    postFormData.append("desc", postData.description);
    postFormData.append("images", postData.image);
    postFormData.append("isApproved", user?.isAlumni || user?.isAdmin);

    const postConfig = {
      url: "/api/v1/forum/",
      method: "post",
      headers: {
        Authorization: `Bearer ${user?.token}`,
        "Content-Type": "multipart/form-data",
      },
      data: postFormData,
    };

    await createPost(postConfig, (res) => {
      successAlert(
        user?.isAlumni || user?.isAdmin
          ? "Your Post Made Successfully"
          : "Post details sent to admin for verification"
      );
    });
    setNewPostActive(false);
  };

  return (
    <ReactPortal wrapperId="new_post_modal_wrapper">
      <div className={styles.new_post_overlay}>
        <div className={styles.new_post_container}>
          {isLoading ? (
            <Loader />
          ) : (
            <>
              <div className={styles.header}>
                <div className={styles.userinfo_container}>
                  <img
                    alt="profile"
                    src={`http://localhost:8000/api/v1/users/user-avatar/${user?._id}`}
                  />
                  <p className={styles.user_name}>{user?.name}</p>
                </div>
                <IoClose
                  size="30px"
                  className={styles.close_icon}
                  onClick={() => setNewPostActive(false)}
                />
              </div>
              <div className={styles.body}>
                <form onSubmit={handleSubmit}>
                  {/* <div className={styles.input_container}>
                    <input
                      name="cname"
                      type="text"
                      id="cname"
                      placeholder="Company Name"
                      value={postData.cname}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.input_container}>
                    <input
                      type="text"
                      name="designation"
                      id="designation"
                      placeholder="Designation"
                      value={postData.designation}
                      onChange={handleChange}
                    />
                  </div> */}
                  <div className={styles.description_container}>
                    <div className={styles.input_container}>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        placeholder="Title"
                        value={postData.title}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={styles.input_container}>
                      <textarea
                        type="text"
                        name="description"
                        id="description"
                        placeholder="Post Description"
                        value={postData.description}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className={styles.img_input_container}>
                    {postData.image && imageSwitch && (
                      <label for="img-switch" alt="image-switch">
                        <img
                          src={require("assets/image-switch.png")}
                          alt="switch-icon"
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        />
                      </label>
                    )}
                    <input
                      name="image"
                      id="img-switch"
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={onSelectFile}
                    />

                    {postData.image ? (
                      <img
                        className={`${imageSwitch && styles.image_blur}`}
                        src={URL.createObjectURL(postData.image)}
                        alt="upload"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      />
                    ) : (
                      <div className={styles.img_input}>
                        <label for="img-input">
                          <BiImageAdd size="50px" />
                          <p>Add Image</p>
                        </label>
                        <input
                          name="post_images"
                          id="img-input"
                          required
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          onChange={onSelectFile}
                        />
                      </div>
                    )}
                  </div>
                  {showError && <p>please upload image</p>}
                  <button className={styles.post_btn} type="submit">
                    <div className={styles.post_name}>Post</div>
                    <div className={styles.post_icon}>
                      <GiPin />
                    </div>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </ReactPortal>
  );
}

export default NewPostModal;
