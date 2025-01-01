// useLocalization.js
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

const useLocalization = () => {
    const router = useRouter();
    const { locale } = router;
    const { t } = useTranslation('common');

    const localizedPath = (path) => {
        return locale === router.defaultLocale ? path : `/${locale}${path}`;
    };

    return { t, localizedPath };
};

export default useLocalization;
