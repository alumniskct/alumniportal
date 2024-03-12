import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./RegistrationPageStudent.module.css";
import Compguy from "assets/compguy.png";
import { register } from "context/auth/actions";
import {
  useAuthContext,
  useAuthDispatchContext,
} from "context/auth/authContext";
import Loader from "components/UI/Loader";
import { useFetchAlumniStoredData } from "hooks/useFetchAlumniStoredData";
import { useAlertContext } from "context/alert/alertContext";
import { Country, State, City } from "country-state-city";
import { validateAll } from "utils/registrationValidation";
const currentYear = new Date().getFullYear();
const range = (start, stop, step) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);

const YearOfPassing = range(1985, currentYear + 4, 1);

const departments = [
  "B.Tech IT",
  "B.E CSE",
  "B.E ECE",
  "B.E EEE",
  "B.E MECH",
  "B.E ICE",
  "B.E CIVIL",
  "MBA",
  "M.E. Structural Engineering",
  "M E ED",
  "ME CSE",
];

const graduationLevelOptions = ["Under graduate", "Post graduate"];

function RegistrationPageStudent() {
  const navigate = useNavigate();
  const dispatch = useAuthDispatchContext();
  const { user, isLoading, error } = useAuthContext();
  const location = useLocation();
  const [image, setImage] = useState("");
  const [formStep, setFormStep] = useState(1);
  const [isCPasswordDirty, setIsCPasswordDirty] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);
  const [data, setData] = useState({
    yearOfPassing: "",
    department: "",
    graduationLevel: "",
    name: "",
    dateOfBirth: "",
    email: "",
    registerNumber: "",
    password: "",
    confirmPassword: "",
    country: "IN",
    state: "TN",
    city: "Coimbatore",
    phoneNumber: "",
    skill: "",
  });
  const [validationError, setValidationError] = useState({
    yearOfPassing: false,
    department: false,
    graduationLevel: false,
    avatar: false,
    name: false,
    dateOfBirth: false,
    email: false,
    registerNumber: false,
    password: false,
    confirmPassword: false,
    country: false,
    state: false,
    city: false,
    phoneNumber: false,
    skill: false,
  });

  const { errorAlert } = useAlertContext();

  const emailRef = useRef("");
  const registerNumberRef = useRef("");
  const departmentRef = useRef("");
  const dateOfBirthRef = useRef("");

  const { alumni } = useFetchAlumniStoredData({
    email: emailRef.current,
  });

  useEffect(() => {
    document.title = "Alumni Portal | Register";
  }, []);

  useEffect(() => {
    if (isCPasswordDirty) {
      if (data.password === data.confirmPassword) {
        setIsPasswordMatch(true);
      } else {
        setIsPasswordMatch(false);
      }
    }
  }, [data.confirmPassword, isCPasswordDirty, data.password]);

  useEffect(() => {
    if (error) errorAlert(error);
  }, [error, errorAlert]);

  useEffect(() => {
    setData((prev) => {
      const dateOfBirth = new Date(alumni?.dateOfBirth);

      let month = "" + (dateOfBirth.getMonth() + 1);
      let day = "" + dateOfBirth.getDate();
      let year = dateOfBirth.getFullYear();

      if (month.length < 2) month = "0" + month;
      if (day.length < 2) day = "0" + day;

      return {
        ...prev,
        name: alumni?.name,
        yearOfPassing: +alumni?.batch + 4,
        // dateOfBirth: [year, month, day].join("-"),
        registerNumber: alumni?.registerNumber,
        phoneNumber: alumni?.contact,
      };
    });
  }, [alumni]);

  const handleChange = (e) => {
    if (e.target.name === "confirmPassword") {
      setIsCPasswordDirty(true);
    }
    if (e.target.name === "phoneNumber") {
      return setData({
        ...data,
        [e.target.name]: e.target.value.slice(0, 10),
      });
    }

    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleInputBlur = (e) => {
    emailRef.current = data.email;
    registerNumberRef.current = data.registerNumber;
    departmentRef.current = data.department;
  };

  const handleSubmitPage1 = async (e) => {
    e.preventDefault();
    const flag = validateAll(data, image, setValidationError, 1);

    if (flag) {
      setFormStep(2);
    }
  };

  const handleChangeProfileImage = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return setImage(image || undefined);
    }
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const flag = validateAll(data, image, setValidationError, 2);
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === "country") {
        return formData.append(
          key,
          Country.getCountryByCode(data.country).name
        );
      }
      if (key === "state") {
        return formData.append(
          key,
          State.getStateByCodeAndCountry(data.state, data.country).name
        );
      }
      formData.append(key, data[key]);
    });
    if (image !== "") formData.append("avatar", image);
    if (flag) {
      await register(dispatch, formData);
    }
  };

  if (user) {
    navigate(location?.from ?? "/");
  }

  const checkKeyDown = (e) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return (
    <div className={styles.container}>
      <div className={styles.image_container}>
        <img src={Compguy} alt="register" />
      </div>
      {isLoading ? (
        <Loader />
      ) : (
        <div className={styles.form_container}>
          <div className={styles.form}>
            <div className={styles.form_header}>
              <h1>{formStep === 1 ? "Register" : "Personal Information"}</h1>
              <h5>
                *if you are already an exsisting alumni please fill the Email
                first
              </h5>
            </div>

            <div className={styles.form_body}>
              {formStep === 1 ? (
                <form
                  onKeyDown={(e) => checkKeyDown(e)}
                  onSubmit={handleSubmitPage1}
                >
                  <section>
                    <div
                      className={`${styles.form_input_container} ${styles.split_container}`}
                    >
                      <select
                        name="yearOfPassing"
                        type="text"
                        id="yop"
                        value={data.yearOfPassing}
                        onChange={handleChange}
                      >
                        <option value="" selected>
                          Year of passing
                        </option>
                        {YearOfPassing.map((year) => (
                          <option
                            key={year}
                            value={year}
                            className={styles.select_items}
                          >
                            {year}
                          </option>
                        ))}
                      </select>

                      <select
                        name="department"
                        type="text"
                        id="dept"
                        value={data.department}
                        onChange={handleChange}
                        onBlur={handleInputBlur}
                      >
                        <option value="" selected hidden>
                          Department
                        </option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    {validationError["yearOfPassing"] && (
                      <p className={styles.validation_error}>
                        Select your year of passing
                      </p>
                    )}
                    {validationError["department"] && (
                      <p className={styles.validation_error}>
                        Select your department
                      </p>
                    )}
                    <div className={styles.form_input_container}>
                      <select
                        name="graduationLevel"
                        type="text"
                        id="graduationLevel"
                        value={data.graduationLevel}
                        onChange={handleChange}
                      >
                        <option value="">Graduation level</option>
                        {graduationLevelOptions.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    {validationError["graduationLevel"] && (
                      <p className={styles.validation_error}>
                        Select your graduation level
                      </p>
                    )}
                    <div
                      className={`${styles.form_input_container} ${styles.split_container} ${styles.mobile_split_container}`}
                    >
                      <div className={styles.profile_image}>
                        <img
                          src={
                            image
                              ? URL.createObjectURL(image)
                              : require("assets/icons/user 1.png")
                          }
                          alt="profile_img"
                        />
                        <label htmlFor="img-switch">
                          <img
                            src={require("assets/image-switch.png")}
                            alt="switch-icon"
                            htmlFor="img-switch"
                          />
                        </label>
                        <input
                          name="avatar"
                          id="img-switch"
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          onChange={handleChangeProfileImage}
                        />
                      </div>

                      <input
                        name="name"
                        type="text"
                        id="name"
                        placeholder="Name"
                        value={data.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      {validationError["avatar"] && (
                        <p className={styles.validation_error}>
                          Choose profile picture
                        </p>
                      )}
                      {validationError["name"] && (
                        <p className={styles.validation_error}>
                          Enter your name
                        </p>
                      )}
                    </div>
                    <div
                      className={`${styles.form_input_container} ${styles.split_container}`}
                    >
                      <input
                        ref={dateOfBirthRef}
                        name="dateOfBirth"
                        type="text"
                        placeholder="Date of Birth"
                        id="dateOfBirth"
                        onFocus={() => (dateOfBirthRef.current.type = "date")}
                        value={data.dateOfBirth}
                        onChange={handleChange}
                        max="2022-04-17"
                      />
                      <input
                        name="email"
                        type="email"
                        id="email"
                        pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{1,63}$"
                        placeholder="Email"
                        value={data.email}
                        onChange={handleChange}
                        onBlur={handleInputBlur}
                      />
                    </div>
                    {validationError["dateOfBirth"] && (
                      <p className={styles.validation_error}>Select your DOB</p>
                    )}
                    {validationError["email"] && (
                      <p className={styles.validation_error}>
                        Enter a valid Email
                      </p>
                    )}
                    <div className={styles.form_input_container}>
                      <input
                        name="registerNumber"
                        type="text"
                        id="register_no"
                        placeholder="Register Number"
                        value={data.registerNumber}
                        onChange={handleChange}
                        onBlur={handleInputBlur}
                      />
                    </div>
                    {validationError["registerNumber"] && (
                      <p className={styles.validation_error}>
                        Enter your Registraion number
                      </p>
                    )}
                    <div className={styles.form_input_container}>
                      <input
                        name="password"
                        type="password"
                        id="password"
                        title="password must be at least 8 characters"
                        pattern="[a-zA-Z0-9!@#$%^\*()]{8,}"
                        placeholder="Password"
                        value={data.password}
                        onChange={handleChange}
                      />
                    </div>
                    {validationError["password"] && (
                      <p className={styles.validation_error}>
                        Enter a valid Password must include{" "}
                        {`(8 or more characters)`}
                      </p>
                    )}
                    <div className={styles.form_input_container}>
                      <input
                        name="confirmPassword"
                        type="password"
                        id="confirm_password"
                        pattern="[a-zA-Z0-9!@#$%^\*()]{8,}"
                        placeholder="Confirm Password"
                        value={data.confirmPassword}
                        onChange={handleChange}
                      />
                    </div>
                    {!isPasswordMatch && isCPasswordDirty && (
                      <p className={styles.validation_error}>
                        password does not match
                      </p>
                    )}
                    <div
                      className={`${styles.form_button_container} ${styles.split_container}`}
                    >
                      <button onClick={() => navigate("/login")}>
                        back to login
                      </button>
                      <button type="submit">next page</button>
                    </div>
                  </section>
                </form>
              ) : (
                <form onSubmit={handleSubmit} onKeyDown={checkKeyDown}>
                  <section>
                    <div className={styles.form_input_container}>
                      <select
                        name="country"
                        type="text"
                        id="country"
                        placeholder="Select your country"
                        value={data.country}
                        onChange={handleChange}
                      >
                        {Country.getAllCountries(data.country).map(
                          (country) => (
                            <option value={country.isoCode}>
                              {country.flag} {country.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    {validationError["country"] && (
                      <p className={styles.validation_error}>
                        Select your country
                      </p>
                    )}

                    <div className={`${styles.form_input_container} `}>
                      <select
                        name="state"
                        id="state"
                        placeholder="Select your state"
                        value={data.state}
                        onChange={handleChange}
                      >
                        {State.getStatesOfCountry(data.country).map((state) => (
                          <option value={state.isoCode}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                    {validationError["state"] && (
                      <p className={styles.validation_error}>
                        Select your state
                      </p>
                    )}

                    <div className={styles.form_input_container}>
                      <select
                        name="city"
                        id="city"
                        placeholder="Enter your contact no"
                        value={data.city}
                        onChange={handleChange}
                      >
                        {City.getCitiesOfState(data.country, data.state).map(
                          (city) => (
                            <option value={city.name}>{city.name}</option>
                          )
                        )}
                      </select>
                    </div>
                    {validationError["city"] && (
                      <p className={styles.validation_error}>
                        select your city
                      </p>
                    )}
                    <div className={styles.form_input_container}>
                      <input
                        name="phoneNumber"
                        type="number"
                        id="phoneNumber"
                        pattern="[0-9]{10}"
                        placeholder="Enter your contact no"
                        value={data.phoneNumber}
                        onChange={handleChange}
                      />
                    </div>
                    {validationError["phoneNumber"] && (
                      <p className={styles.validation_error}>
                        Enter your contact no
                      </p>
                    )}
                    <div className={styles.form_input_container}>
                      <input
                        name="skill"
                        type="text"
                        id="skill"
                        placeholder="Skill/Domain"
                        value={data.skill}
                        onChange={handleChange}
                      />
                    </div>
                    {validationError["skill"] && (
                      <p className={styles.validation_error}>
                        Enter your skills
                      </p>
                    )}
                    <div
                      className={`${styles.form_button_container} ${styles.split_container}`}
                    >
                      <button onClick={() => setFormStep(1)}>Back</button>
                      <button type="submit">Submit</button>
                    </div>
                  </section>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrationPageStudent;
