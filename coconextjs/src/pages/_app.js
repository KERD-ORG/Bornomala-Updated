import { appWithTranslation } from "next-i18next";
import nextI18NextConfig from "../../next-i18next.config.js";
import { useEffect } from "react";
import { UserPermissionsProvider } from "../contexts/UserPermissionsContext";
import useIdleLogout from "../hooks/useIdleLogout";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import "bootstrap/dist/css/bootstrap.min.css";

import "./../styles/vendor/fonts/boxicons.css";
import "./../styles/vendor/css/core.css";
import "./../styles/vendor/css/theme-default.css";
import "./../styles/css/demo.css";
import "./../styles/vendor/css/pages/page-auth.css";
import "./../styles/vendor/libs/nouislider/nouislider.css";
import "./../styles/vendor/libs/swiper/swiper.css";
import "./../styles/vendor/libs/typeahead-js/typeahead.css";
import "./../styles/vendor/libs/apex-charts/apex-charts.css";

function App({ Component, pageProps }) {
  const autoLogoutDuration =
    parseInt(process.env.NEXT_PUBLIC_AUTO_LOGOUT_DURATION) || 60000; // Default to 1 minute if not set

  useIdleLogout(autoLogoutDuration);

    useEffect(() => {
        import('bootstrap/dist/js/bootstrap.bundle.min.js');
        const loadAdditionalStyles = async () => {
            if (Component.layout === 'auth') {
                await import('./../styles/vendor/css/core.css');
                await import('./../styles/vendor/css/theme-default.css');
            }
            if (Component.layout === 'org_registration_front') {
              await import('./../styles/vendor/css/core.css');
              await import('./../styles/vendor/css/theme-default.css');
          }
            if (Component.layout === 'landing') {
                await import('./../styles/vendor/css/pages/front-page.css');
                await import('./../styles/vendor/css/pages/front-page-landing.css');
            }
            if (Component.layout === 'landing_org') {
                await import('./../styles/vendor/css/pages/front-page.css');
                await import('./../styles/vendor/css/pages/front-page-landing.css');
            }
            if (Component.layout === 'default') {
                await import('./../styles/vendor/css/rtl/core.css');
                await import('./../styles/vendor/css/rtl/theme-default.css');
            }
        };

    loadAdditionalStyles();
  }, [Component.layout]);

  // Check if the page requires reCAPTCHA
  const requiresReCaptcha = Component.requiresReCaptcha;

  return (
    <>
      {requiresReCaptcha ? (
        <GoogleReCaptchaProvider
          reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
          scriptProps={{
            async: false,
            defer: false,
            appendTo: "head",
            nonce: undefined,
          }}
        >
          <UserPermissionsProvider>
            <Component {...pageProps} />
          </UserPermissionsProvider>
        </GoogleReCaptchaProvider>
      ) : (
        <UserPermissionsProvider>
          <Component {...pageProps} key={Component.layout || ""} />
        </UserPermissionsProvider>
      )}
    </>
  );
}

export default appWithTranslation(App, nextI18NextConfig);
