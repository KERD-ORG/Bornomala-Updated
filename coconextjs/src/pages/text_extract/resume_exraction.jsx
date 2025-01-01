import {
  React,
  useState,
  useEffect,
  executeAjaxOperationStandard,
  getToken,
  useRouter,
  Loader,
  CustomAlert,
  useTranslation,
} from '../../utils/commonImports';
import Layout from '../../components/layout';
import Button from 'react-bootstrap/Button';

const ResumeProcess = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [extractedData, setExtractedData] = useState(null);

  useEffect(() => {
    const fetchedToken = getToken();
    if (!fetchedToken) {
      router.push(process.env.NEXT_PUBLIC_URL_SIGNIN); // Redirect to login if no token
    } else {
      setToken(fetchedToken); // Set the token in state
    }
  }, [router]);

  const handleProcessResume = async () => {
    setLoading(true);
    try {
      const response = await executeAjaxOperationStandard({
        url: process.env.NEXT_PUBLIC_API_ENDPOINT_PROCESS_RESUME,
        method: 'post',
        token,
        locale: router.locale || 'en',
      });

      if (response.data) {
        setExtractedData(response.data.extracted_data);
        sessionStorage.setItem('extractedData', JSON.stringify(response.data.extracted_data));
        setSuccessMessage(t(response.data.message || 'Resume processed successfully.'));
        setGlobalError('');
      } else {
        setGlobalError(response.message || t('An error occurred while processing the resume.'));
        setSuccessMessage('');
      }
    } catch (error) {
      console.error('Error processing resume:', error);
      setGlobalError(t('An error occurred while processing the resume.' + error.message));
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const renderExtractedData = () => {
    if (!extractedData) return null;

    return (
      <div className="mt-4">
        <h5>{t('Extracted Data')}</h5>
        {Object.keys(extractedData).map((section, index) => (
          <div key={index} className="mb-3">
            <h6>{t(section)}</h6>
            <ul>
              {extractedData[section].map((item, idx) => (
                <li key={idx}>
                  {Object.entries(item).map(([key, value], i) => (
                    <div key={i}>
                      <strong>{t(key)}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{t('Resume Process')}</h1>
        <Button className="btn btn-primary" onClick={handleProcessResume}>
          {t('Process Resume')}
        </Button>
      </div>
      {globalError && (
        <CustomAlert
          message={globalError}
          dismissable={true}
          timer={parseInt(process.env.NEXT_PUBLIC_ALERT_TIME)}
          onClose={() => setGlobalError('')}
          type="danger"
        />
      )}
      {successMessage && (
        <CustomAlert
          message={successMessage}
          dismissable={true}
          timer={parseInt(process.env.NEXT_PUBLIC_ALERT_TIME)}
          onClose={() => setSuccessMessage('')}
          type="success"
        />
      )}
      {loading && <Loader />}
      {renderExtractedData()}
    </Layout>
  );
};

export default ResumeProcess;
