module.exports = {
    locales: ['en', 'bn', 'fr'], // Match locales from your i18n config
    output: './public/locales/$LOCALE/common.json', // Output translation files
    keySeparator: false, // Avoid hierarchical keys
    namespaceSeparator: false, // Avoid namespace separation
    defaultValue: '', // Leave values empty for untranslated keys
    useKeysAsDefaultValue: true, // Optionally use keys as default English values
    createOldCatalogs: false, // Avoid creating backups
};
