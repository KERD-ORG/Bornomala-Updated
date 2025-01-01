// utils/withAuthServerSideProps.js
import { parse } from 'cookie'; // Correctly import parse

export function withAuthServerSideProps(getServerSidePropsFunc) {
  return async (context) => {
    const { req } = context;
    // Ensure cookies are parsed correctly from the request headers
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};

    // Check if the token is present
    const token = cookies.token;

    if (!token) {
      // Redirect to login page if not logged in
      return {
        redirect: {
          destination: '/signin', // Adjust the sign-in path as needed
          permanent: false,
        },
      };
    }

    // If there is a getServerSideProps function defined, call it
    if (getServerSidePropsFunc) {
      return await getServerSidePropsFunc(context);
    }

    // Proceed with rendering the page if logged in
    return { props: {} };
  };
}
