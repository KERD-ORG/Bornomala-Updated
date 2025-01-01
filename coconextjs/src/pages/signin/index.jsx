import React, { useEffect, useState } from "react";
import Head from "next/head";
import Layout from "../../components/layout_auth";
import Loader from "../../components/Loader";
import { useRouter } from "next/router";
import Link from "next/link";
import Cookie from "js-cookie";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import useLocalization from "../../hooks/useLocalization";
import { SIGNIN_MESSAGES } from "../messages";
import Logo from "../../components/logo";
import { executeAjaxOperation } from "@/utils/fetcher";

export default function Signin({ locale }) {
  const { t, localizedPath } = useLocalization();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); //State for password visibility
  const [Locked, setLocked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await executeAjaxOperation({
          url: process.env.NEXT_PUBLIC_API_ENDPOINT_CHECK_IP_LOCK,
          //   csrfToken: getCookie("csrftoken"),
          locale: router.locale || locale,
        });
        if (response.success) {
          setLocked(false);
          console.log("ok");
        } else {
          setLocked(true);
          console.log("lock");
        }

        if (sessionStorage.getItem("registered") === "true") {
          setShowRegistrationSuccess(true);
          sessionStorage.removeItem("registered");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_LOGIN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept-Language": router.locale || locale,
        },
        body: JSON.stringify({
          username,
          password,
          rememberMe,
          otp,
        }),
      }
    );

    setLoading(false);
    if (response.status == 403) {
      setLocked(true);
      const data = await response.json();
      setError(data.detail);
    } else if (response.ok) {
      const data = await response.json();
      if (data.soft_login_required) {
        setShowOtpField(true);
      } else {
        console.log("Login successful", data);
        Cookie.set("token", data.token, { expires: 7 });
        window.location.href = localizedPath("/dashboard");
      }
    } else {
      const errorMessage = await response.json();
      setError(
        errorMessage.detail ||
          t("Login failed. Please check your username and password.")
      );
    }
  };

  const getCookie = (name) => {
    const cookieValue = document.cookie.match(
      "(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"
    );
    return cookieValue ? cookieValue.pop() : "";
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <Layout>
      <Head>
        <title>{t(SIGNIN_MESSAGES.signIn)}</title>
        <meta
          name="description"
          content="{t(SIGNIN_MESSAGES.signInToYourAccount)}"
        />
      </Head>
      <div className="card">
        <div className="card-body">
          {showRegistrationSuccess && (
            <div className="alert alert-success" role="alert">
              {t(SIGNIN_MESSAGES.registrationSuccess)}
            </div>
          )}

          <div className="app-brand justify-content-center">
            <a href={localizedPath("/")} className="app-brand-link gap-2">
              <span className="app-brand-logo demo">
                <Logo />
              </span>
              <span className="app-brand-text demo text-body fw-bold"  style={{ textTransform: "none" }}>
                {process.env.NEXT_PUBLIC_DOMAIN_NAME}
              </span>
            </a>
          </div>

          <h4 className="mb-2">{t(SIGNIN_MESSAGES.welcomeToCOCO)}</h4>
          <p className="mb-4">{t(SIGNIN_MESSAGES.signInToAccount)}</p>

          {!showOtpField && (
            <form
              id="formAuthentication"
              className="mb-3"
              onSubmit={handleSubmit}
            >
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  {t("Email or Username")}
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  placeholder={t("Enter your email or username")}
                  autoFocus=""
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="mb-3 form-password-toggle">
                <div className="d-flex justify-content-between">
                  <label className="form-label" htmlFor="password">
                    {t("Password")}
                  </label>
                  <a
                    href={localizedPath(
                      `${process.env.NEXT_PUBLIC_URL_FORGOT_PASSWORD}`
                    )}
                  >
                    <small>{t(SIGNIN_MESSAGES.forgotPassword)}?</small>
                  </a>
                </div>
                <div className="input-group input-group-merge">
                  <input
                    type={passwordVisible ? "text" : "password"} // Toggle between text and password
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
                    onClick={togglePasswordVisibility}
                  >
                    <i
                      className={`bx ${
                        passwordVisible ? "bx-show" : "bx-hide"
                      }`}
                    />
                  </span>
                </div>
              </div>
              {error && <p style={{ color: "red" }}>{error}</p>}
              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="remember-me">
                    {t(SIGNIN_MESSAGES.rememberMe)}
                  </label>
                </div>
              </div>

              <div className="mb-3">
                {Locked ? (
                  <button
                    className="btn btn-primary d-grid w-100"
                    type="submit"
                    disabled
                  >
                    {t(SIGNIN_MESSAGES.signIn)}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary d-grid w-100"
                    type="submit"
                  >
                    {t(SIGNIN_MESSAGES.signIn)}
                  </button>
                )}
              </div>
            </form>
          )}

          {showOtpField && (
            <form
              id="formAuthentication"
              className="mb-3"
              onSubmit={handleSubmit}
            >
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  {t("OTP")}
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="otp"
                  name="otp"
                  placeholder="Enter OTP"
                  autoFocus=""
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              {error && <p style={{ color: "red" }}>{error}</p>}
              <div className="mb-3">
                <button className="btn btn-primary d-grid w-100" type="submit">
                  {t(SIGNIN_MESSAGES.submitOTP)}
                </button>
              </div>
            </form>
          )}

          <p className="text-center">
            <span>{t(SIGNIN_MESSAGES.newOnPlatform)}?</span>
            <a href={localizedPath(`${process.env.NEXT_PUBLIC_URL_SIGNUP}`)}>
              <span> {t(SIGNIN_MESSAGES.createAnAccount)}</span>
            </a>
          </p>

          <p className="text-center">
              <span>Need to register your organization?</span>
              <a href={localizedPath('/org/signup')}>
                  <span> Register</span>
              </a>
          </p>
        </div>
      </div>
      {loading && <Loader />}
    </Layout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])), // Load the 'common' namespace
    },
  };
}

Signin.layout = "landing";
