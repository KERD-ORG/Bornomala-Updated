import useLocalization from "@/hooks/useLocalization";
import CustomAlert from "@/utils/CustomAlert";
import { fetcher } from "@/utils/fetcher";
import React, { useState } from "react";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { t, localizedPath } = useLocalization();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetcher.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_API_ENDPOINT_NEWSLETTER}`,
        { email }
      );
      console.log(res)
      if (res.status === 201) setSuccess(res.message);
      else setError(res.email[0]);
    } catch (error) {
      console.log(error);
      setError("Email already exist or something wrong happend");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form className="footer-form" onSubmit={handleSubmit}>
      <label htmlFor="footer-email" className="small">
        {t("Subscribe to newsletter")}
      </label>
      <div className="d-flex mt-1 text-white">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control rounded-0 rounded-start-bottom rounded-start-top"
          id="footer-email"
          placeholder="Your email"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary shadow-none rounded-0 rounded-end-bottom rounded-end-top"
        >
          {t("Subscribe")}
        </button>
      </div>
      {success && (
        <CustomAlert
          message={success}
          dismissable
          type={"success"}
          timer={2000}
          onClose={() => setSuccess("")}
        />
      )}
      {error && (
        <CustomAlert
          message={error}
          dismissable
          timer={2000}
          type={"danger"}
          onClose={() => setError("")}
        />
      )}
    </form>
  );
}

export default Newsletter;
