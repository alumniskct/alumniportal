import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactPortal from "components/Modal/ReactPortal";
import ForumCard from "components/ForumComponents/ForumCard";
import styles from "./ProfileModal.module.css";
import {
  useAuthContext,
  useAuthDispatchContext,
} from "context/auth/authContext";
import { Link, useNavigate } from "react-router-dom";
import { useAlumniContext } from "context/alumni/alumniContext";
import { logout } from "context/auth/actions";
import { BsPeople, BsTrash } from "react-icons/bs";
import { IoLogOutOutline } from "react-icons/io5";
import useUserProfileData from "hooks/useUserProfileData";
import Loader from "components/UI/Loader";
import useGetForumPosts from "hooks/useGetForumPosts";
import useAxiosWithCallback from "hooks/useAxiosWithCallback";
import { useAlertContext } from "context/alert/alertContext";
import ErrorDialogue from "components/UI/ErrorDialogue";
import { FiMail } from "react-icons/fi";

const PROFILE_IMAGES = [
  <img src={require("assets/Profile_images/2.png")} alt="cover_img" />,
  <img src={require("assets/Profile_images/3.png")} alt="cover_img" />,
  <img src={require("assets/Profile_images/1.png")} alt="cover_img" />,
  <img src={require("assets/Profile_images/4.png")} alt="cover_img" />,
  <img src={require("assets/Profile_images/5.png")} alt="cover_img" />,
];

function ProfileModal({ isOpen, handleClose, userId }) {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  const { user, isLoading, error, trigger } = useUserProfileData(userId);

  const profileContainerRef = useRef();
  const {
    isLoading: isPostLoading,
    error: postError,
    posts,
  } = useGetForumPosts(userId, profileContainerRef.current);

  const { user: loggedInUser } = useAuthContext();
  const { alumni } = useAlumniContext();
  const [show, setShow] = useState({
    desc: user?.description === undefined ? false : true,
    post: user?.description === undefined ? true : false,
  });
  const [editProfile, setEditProfile] = useState(false);
  const [image, setImage] = useState("");
  const [banner, setBanner] = useState(null);
  const dispatch = useAuthDispatchContext();
  const isUser = user ? user._id === loggedInUser?._id : false;
  const [editedData, setEditedData] = useState(user);
  const { fetchData: updateProfile } = useAxiosWithCallback();
  const { fetchData: deleteAccount } = useAxiosWithCallback();
  const { fetchData: verifyEmail } = useAxiosWithCallback();
  const { successAlert, errorAlert } = useAlertContext();

  useEffect(() => {
    document.title = "Alumni Portal | Profile";
  }, []);

  const pick_image = useCallback(() => {
    const random_number = Math.floor(Math.random() * PROFILE_IMAGES.length);
    return PROFILE_IMAGES[random_number];
  }, []);

  const onVerifyEmail = () => {
    const config = {
      url: "/api/v1/users/request-verify-email",
      method: "post",
      headers: {
        Authorization: `Bearer ${loggedInUser?.token}`,
      },
      data: {
        user: user?._id,
      },
    };
    verifyEmail(
      config,
      () => {
        successAlert("Email has been sent for verification");
      },
      (err) => {
        errorAlert(err.response.data.message);
      }
    );
  };

  const handleChangeProfileImage = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return setImage(image || undefined);
    }
    setImage(e.target.files[0]);
  };

  const handleSocialChange = (e, name) => {
    setEditedData((prev) => ({
      ...prev,
      alumni: {
        ...prev?.alumni,
        social: {
          ...prev?.alumni?.social,
          [name]: e.target.value,
        },
      },
    }));
  };

  const handleChange = (e, name) => {
    setEditedData({
      ...editedData,
      [name]: e.currentTarget.textContent,
    });
  };

  const handleShow = (name) => {
    if (name === "desc") {
      setShow({
        desc: true,
        post: false,
      });
    } else {
      setShow({
        desc: false,
        post: true,
      });
    }
  };

  const handleDeleteAccount = async () => {
    const config = {
      url: "/api/v1/users/",
      method: "delete",
      headers: {
        Authorization: `Bearer ${loggedInUser?.token}`,
      },
    };
    deleteAccount(
      config,
      () => {
        successAlert("Account Deleted");
      },
      (err) => {
        errorAlert(err.response.data.message);
      }
    );
    await logout(dispatch);
  };

  const handleLogout = async () => {
    await logout(dispatch);
    handleClose();
  };

  const handleUpdate = async (e) => {
    const updateData = new FormData();
    if (image !== "") updateData.append("avatar", image);
    updateData.append("name", editedData.name);

    const updateConfig = {
      method: "patch",
      url: "/api/v1/users/",
      headers: {
        "content-type": "multipart/form-data",
        Authorization: "Bearer " + loggedInUser?.token,
      },
      data: updateData,
    };

    await updateProfile(updateConfig, () => {
      successAlert("Profile updated successfully ");
    });
    setEditProfile(false);
  };

  useEffect(() => {
    const closeOnEscapeKey = (e) => (e.key === "Escape" ? handleClose() : null);
    document.body.addEventListener("keydown", closeOnEscapeKey);
    return () => {
      document.body.removeEventListener("keydown", closeOnEscapeKey);
    };
  }, [handleClose]);

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setShow({
      desc: user?.description === undefined ? false : true,
      post: user?.description === undefined ? true : false,
    });
  }, [user?.description]);

  useEffect(() => {
    setEditedData(user);
  }, [user]);

  useEffect(() => {
    setBanner(pick_image());
  }, [user]);
  if (isLoading) return <Loader />;

  if (error || postError) {
    return (
      <div className={styles.profile_overlay} onClick={handleClose}>
        <div
          className={styles.profile_container}
          onClick={(e) => e.stopPropagation()}
        >
          <ErrorDialogue errorMessage={error.message} />;
        </div>
      </div>
    );
  }

  return (
    <ReactPortal wrapperId="profile_content_wrapper">
      <div className={styles.profile_overlay} onClick={handleClose}>
        <div
          ref={profileContainerRef}
          className={styles.profile_container}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.profile_header}>{banner}</div>
          <div className={styles.profile_body}>
            <div className={styles.profile_img}>
              <img
                src={
                  image
                    ? URL.createObjectURL(image)
                    : `/api/v1/users/user-avatar/${userId}`
                }
                alt="profile_img"
              />
              {editProfile && (
                <label htmlFor="img-switch">
                  <img
                    src={require("assets/image-switch.png")}
                    alt="switch-icon"
                  />
                </label>
              )}
              <input
                name="image"
                id="img-switch"
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handleChangeProfileImage}
              />
            </div>
            {windowDimensions.width < 780 && (
              <div className={styles.close_btn}>
                <p onClick={handleClose}> close </p>
              </div>
            )}

            <div
              className={`${styles.profile_info} ${
                editProfile && styles.profile_info_edit
              }`}
            >
              <h2
                className={`${editProfile && styles.editActive}`}
                contentEditable={editProfile}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleChange(e, "name")}
              >
                {user?.name}
              </h2>
              {user?.isAlumni && (
                <h3
                  className={`${editProfile && styles.editActive}`}
                  contentEditable={editProfile}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleChange(e, "designation")}
                >
                  {printDesignation(user?.isAlumni, user?.isAdmin) ||
                    user?.alumni?.designation}{" "}
                  {`${
                    user?.alumni?.organization &&
                    "at " + user?.alumni?.organization
                  }`}
                </h3>
              )}
              {/* <div
                className={`${styles.location} ${
                  editProfile && styles.editActive
                }`}
              >
                <img
                  src={require("assets/icons/location.png")}
                  alt="location icon"
                />
                <p
                  suppressContentEditableWarning={true}
                  contentEditable={editProfile}
                  onBlur={(e) => handleChange(e, "location")}
                >
                  {user?.city}, {user?.country}
                </p>
              </div> */}
              {user?.isAlumni && user?.alumni?.social && (
                <>
                  <h4>Available on</h4>
                  {!editProfile && (
                    <div className={styles.social}>
                      {user?.alumni?.social?.linkedin && (
                        <a
                          rel="noreferrer"
                          target={"_blank"}
                          href={user?.alumni?.social?.linkedin}
                        >
                          <img
                            src={require("assets/icons/social/slack.png")}
                            alt="slack icon"
                          />
                        </a>
                      )}
                      {user?.alumni?.social?.twitter && (
                        <a
                          rel="noreferrer"
                          target={"_blank"}
                          href={user?.alumni?.social?.twitter}
                        >
                          <img
                            src={require("assets/icons/social/twitter.png")}
                            alt="twitter icon"
                          />
                        </a>
                      )}

                      {user?.alumni?.social?.github && (
                        <a
                          rel="noreferrer"
                          target={"_blank"}
                          href={user?.alumni?.social?.github}
                        >
                          <img
                            src={require("assets/icons/social/gitHub.png")}
                            alt="gitHub icon"
                          />
                        </a>
                      )}

                      {user?.alumni?.social?.facebook && (
                        <a
                          rel="noreferrer"
                          target={"_blank"}
                          href={user?.alumni?.social?.facebook}
                        >
                          <img
                            src={require("assets/icons/social/facebook.png")}
                            alt="facebook icon"
                          />
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}

              {editProfile && user?.isAlumni && (
                <div className={styles.editSocial_container}>
                  <div
                    className={`${styles.editSocial} ${
                      editProfile && styles.editActive
                    }`}
                  >
                    <input
                      placeholder={"Add your Twitter handle link"}
                      onChange={(e) => {
                        handleSocialChange(e, "twitter");
                      }}
                    ></input>
                    <img
                      src={require(`assets/icons/social/twitter.png`)}
                      alt="social icon"
                    />
                  </div>

                  <div
                    className={`${styles.editSocial} ${
                      editProfile && styles.editActive
                    }`}
                  >
                    <input
                      onChange={(e) => handleSocialChange(e, `linkedIn}`)}
                      placeholder={"Your Linked Handle link"}
                      value={editedData?.alumni?.social?.linkedIn}
                    />

                    <img
                      src={require(`assets/icons/social/linkedin.png`)}
                      alt="social icon"
                    />
                  </div>

                  <div
                    className={`${styles.editSocial} ${
                      editProfile && styles.editActive
                    }`}
                  >
                    <input
                      placeholder="Add your Github profile link"
                      value={editedData?.alumni?.social?.github}
                      onChange={(e) => {
                        handleChange(e, `github`);
                      }}
                    />
                    <img
                      src={require(`assets/icons/social/gitHub.png`)}
                      alt="social icon"
                    />
                  </div>

                  <div
                    className={`${styles.editSocial} ${
                      editProfile && styles.editActive
                    }`}
                  >
                    <input
                      value={editedData?.alumni?.social?.facebook}
                      onChange={(e) => handleChange(e, `facebook`)}
                      placeholder="Add your Facebook profile link"
                    />
                    <img
                      src={require(`assets/icons/social/facebook.png`)}
                      alt="social icon"
                    />
                  </div>
                </div>
              )}

              {isUser && (
                <div className={styles.profile_controls_container}>
                  {!editProfile ? (
                    <div
                      className={styles.profile_controls}
                      onClick={() => setEditProfile(true)}
                    >
                      <img
                        src={require("assets/icons/edit.png")}
                        alt="edit icon"
                      />
                      <p>Edit Profile</p>
                    </div>
                  ) : (
                    <div
                      className={styles.profile_controls}
                      onClick={() => {
                        handleUpdate();
                      }}
                    >
                      <p>Save</p>
                    </div>
                  )}
                  {!user?.isAdmin && (
                    <div
                      className={styles.profile_controls}
                      onClick={handleDeleteAccount}
                    >
                      <BsTrash />
                      <p>Delete Account</p>
                    </div>
                  )}
                  {!editProfile &&
                    !user?.alumni &&
                    !user.isAdmin &&
                    !alumni &&
                    user && (
                      <div className={styles.profile_controls}>
                        <BsPeople />
                        <p>
                          <Link onClick={handleClose} to="/register-alumni">
                            Apply as Alumni
                          </Link>
                        </p>
                      </div>
                    )}
                  {!editProfile && (
                    <div
                      className={styles.profile_controls}
                      onClick={handleLogout}
                    >
                      <IoLogOutOutline />
                      <p>Logout</p>
                    </div>
                  )}
                  {!user?.isEmailVerified && isUser && !editProfile && (
                    <div className={styles.profile_controls}>
                      <FiMail />
                      <p>
                        <a onClick={onVerifyEmail}>Verify Email</a>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.profile_description_container}>
              <div className={styles.description_topbar}>
                {user?.description && (
                  <p
                    className={`${show.desc && styles.selected}`}
                    onClick={() => handleShow("desc")}
                  >
                    Self Description
                  </p>
                )}
                <p
                  className={`${show.post && styles.selected}`}
                  onClick={() => handleShow("post")}
                >
                  Posts
                </p>
              </div>
              {user?.description && show.desc && (
                <div className={styles.description}>
                  <p
                    className={`${editProfile && styles.editActive}`}
                    suppressContentEditableWarning={true}
                    contentEditable={editProfile}
                    onBlur={(e) => handleChange(e, "description")}
                  >
                    {user?.description || "Add Bio"}
                  </p>
                </div>
              )}

              {show.post && (
                <div className={styles.posts}>
                  {postError ? (
                    <ErrorDialogue errorMessage={postError.message} />
                  ) : (
                    posts.map((post) => (
                      <ForumCard
                        key={post.id}
                        data={post}
                        profileActive={true}
                        profileEdit={editProfile}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ReactPortal>
  );
}

function printDesignation(isAlumni, isAdmin) {
  if (isAlumni) return false;
  if (isAdmin) return "Admin of Alumni Portal";
  else return "Student at SKCT";
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export default ProfileModal;
