// src/components/SignupForm.jsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { SIGNUP_MESSAGES } from "@/pages/messages";
import useLocalization from "@/hooks/useLocalization";
import { CircularProgress } from "@mui/material";

export default function RegisterUser({ onSuccess, onCancel }) {
  const { t, localizedPath } = useLocalization();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstname] = useState("");
  const [middleName, setMiddlename] = useState("");
  const [lastName, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setPasswordVisible(!passwordVisible);
    } else if (field === "confirmPassword") {
      setConfirmPasswordVisible(!confirmPasswordVisible);
    }
  };

  const validate = () => {
    let tempErrors = {};
    tempErrors.confirmPassword =
      password === confirmPassword
        ? ""
        : t(SIGNUP_MESSAGES.passwordsDoNotMatch);
    tempErrors.agreeTerms = agreeTerms ? "" : t(SIGNUP_MESSAGES.pleaseAgree);
    setErrors(tempErrors);
    return Object.values(tempErrors).every((x) => x === "");
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_ROLES}`
      );
      if (!response.ok) throw new Error("Failed to fetch roles");
      const data = await response.json();
      setRoles(data.roles);
    } catch (error) {
      setErrors({ global: error.message });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!executeRecaptcha) return;
    // console.log(executeRecaptcha)
    const gReCaptchaToken = await executeRecaptcha();

    if (!validate()) return;

    setLoading(true);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_REGISTER}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": router.locale || "en",
        },
        body: JSON.stringify({
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          username,
          email,
          password,
          role,
          gRecaptchaToken: gReCaptchaToken,
        }),
      }
    );

    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      setFirstname("");
      setMiddlename("");
      setLastname("");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("");
      setErrors({});
      if (onSuccess) onSuccess();
    } else {
      const newErrors = {};
      if (data.username) newErrors.username = data.username.join(" ");
      if (data.email) newErrors.email = data.email.join(" ");
      if (data.password) newErrors.password = data.password.join(" ");
      if (data.first_name) newErrors.firstName = data.first_name.join(" ");
      if (data.middle_name) newErrors.middleName = data.middle_name.join(" ");
      if (data.last_name) newErrors.lastName = data.last_name.join(" ");
      if (data.role) newErrors.role = data.role.join(" ");
      setErrors(newErrors);
    }
  };

  // Fetch roles when the component is mounted
  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields similar to what you already have */}
      {/* You can include firstName, middleName, lastName, username, email, password, confirmPassword, role, agreeTerms */}
      {/* Use the togglePasswordVisibility and other logic as it is */}
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="first_name" className="form-label">
              {t(SIGNUP_MESSAGES.firstName)}
            </label>
            <input
              type="text"
              className="form-control"
              id="first_name"
              name="first_name"
              placeholder={t("Enter your first name")}
              autoFocus=""
              value={firstName}
              onChange={(e) => setFirstname(e.target.value)}
            />
            {errors.firstName && (
              <div className="text-danger">{errors.firstName}</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="last_name" className="form-label">
              {t(SIGNUP_MESSAGES.lastName)}
            </label>
            <input
              type="text"
              className="form-control"
              id="last_name"
              name="last_name"
              placeholder={t("Enter your last name")}
              autoFocus=""
              value={lastName}
              onChange={(e) => setLastname(e.target.value)}
            />
            {errors.lastName && (
              <div className="text-danger">{errors.lastName}</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              {t(SIGNUP_MESSAGES.email)}
            </label>
            <input
              type="text"
              className="form-control"
              id="email"
              name="email"
              placeholder={t("Enter your email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <div className="text-danger">{errors.email}</div>}
          </div>

          <div className="mb-3 form-password-toggle">
            <label className="form-label" htmlFor="password">
              {t(SIGNUP_MESSAGES.password)}
            </label>
            <div className="input-group input-group-merge">
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                className="form-control"
                name="password"
                placeholder="············"
                aria-describedby="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="input-group-text cursor-pointer"
                onClick={() => togglePasswordVisibility("password")}
              >
                <i
                  className={`bx ${passwordVisible ? "bx-show" : "bx-hide"}`}
                />
              </span>
            </div>
            {errors.password && (
              <div className="text-danger">{errors.password}</div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label htmlFor="last_name" className="form-label">
              {t(SIGNUP_MESSAGES.middleName)}
            </label>
            <input
              type="text"
              className="form-control"
              id="middle_name"
              name="middle_name"
              placeholder={t("Enter your middle name")}
              autoFocus=""
              value={middleName}
              onChange={(e) => setMiddlename(e.target.value)}
            />
            {errors.middleName && (
              <div className="text-danger">{errors.middleName}</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              {t(SIGNUP_MESSAGES.username)}
            </label>
            <input
              type="text"
              className="form-control"
              id="username"
              name="username"
              placeholder={t("Enter your username")}
              autoFocus=""
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username && (
              <div className="text-danger">{errors.username}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">{t("Role")}</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">{t("Select your role")}</option>
              {roles.map((roleName) => (
                <option key={roleName} value={roleName}>
                  {roleName}
                </option>
              ))}
            </select>
            {errors.role && <div className="text-danger">{errors.role}</div>}
          </div>

          <div className="mb-3 form-password-toggle">
            <label className="form-label" htmlFor="confirm_password">
              {t(SIGNUP_MESSAGES.confirmPassword)}
            </label>
            <div className="input-group input-group-merge">
              <input
                type={confirmPasswordVisible ? "text" : "password"}
                id="confirm_password"
                className="form-control"
                name="confirm_password"
                placeholder="············"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span
                className="input-group-text cursor-pointer"
                onClick={() => togglePasswordVisibility("confirmPassword")}
              >
                <i
                  className={`bx ${
                    confirmPasswordVisible ? "bx-show" : "bx-hide"
                  }`}
                />
              </span>
            </div>
            {errors.confirmPassword && (
              <div className="text-danger">{errors.confirmPassword}</div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="terms-conditions"
            name="terms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="terms-conditions">
            {t(SIGNUP_MESSAGES.agreeToTerms)}{" "}
            <a href="#">{t(SIGNUP_MESSAGES.privacyPolicyAndTerms)}</a>
          </label>
          {errors.agreeTerms && (
            <div className="text-danger">{errors.agreeTerms}</div>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          disabled={loading}
          className="btn btn-secondary"
          onClick={onCancel}
        >
          {t("Cancel")}
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? (
            <CircularProgress size={20} style={{ color: "white" }} />
          ) : (
            t("Register")
          )}
        </button>
      </div>
    </form>
  );
}
