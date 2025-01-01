// src/pages/recommendation/index.jsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const TextExtractIndex = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the recommendations page
    router.replace('/text_extract/resume_exraction');
  }, []);

  return null; // This page doesn't render anything visible to the user
};

export default TextExtractIndex;