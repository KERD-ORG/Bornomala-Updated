// utils/hooks/useCommonForm.js

import {
    React,
    useRef,
    useState,
    useEffect,
    useRouter,
    executeAjaxOperationStandard,
    axios,
    getToken,
    profileTabOrder,
    PrevNextButtons,
    useTranslation,
    Loader,
    CustomAlert,
} from '../utils/commonImports';

const useCommonFormWithoutToken = () => {
    const { t } = useTranslation('common');
    const formRef = useRef(null);
    const router = useRouter();
    
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [token, setToken] = useState(null);

    const { tab } = router.query;
    const currentIndex = profileTabOrder.indexOf(tab) !== -1 ? profileTabOrder.indexOf(tab) : 0;
    const previousTab = profileTabOrder[currentIndex - 1];
    const nextTab = profileTabOrder[currentIndex + 1];

    return {
        t,
        formRef,
        router,
        loading,
        setLoading,
        globalError,
        setGlobalError,
        successMessage,
        setSuccessMessage,
        token,
        setToken,
        previousTab,
        nextTab,
        currentIndex,
    };
};

export default useCommonFormWithoutToken;
