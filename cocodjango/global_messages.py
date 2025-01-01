from django.utils.translation import gettext_lazy
import os

max_size = int(os.getenv("MAX_FILE_UPLOAD_SIZE"))

ERROR_MESSAGES = {
    'generic_error': gettext_lazy("An error has occurred. Please try again later."),
    'invalid_extension': gettext_lazy('Please upload a file with one of the following extensions: {extensions}.'),
    'exceeds_max_size': gettext_lazy('File size exceeds the maximum limit.'),
    'upload_either': gettext_lazy('Please upload either a Resume or a SOP file.'),
    'pdf_for_resume': gettext_lazy('Please upload a PDF file for Resume.'),
    'jpg_for_image': gettext_lazy('Please upload a JPG/PNG/JPEG/SVG/EPS file for Image.'),
    'pdf_for_sop': gettext_lazy('Please upload a PDF file for SOP.'),
    'fix_following_error': gettext_lazy('Please fix the following error.'),
    'image_size_exceed': gettext_lazy('Image size should be less than %(max_size)d mb'),
    'missing_recaptcha_token': gettext_lazy("Missing reCAPTCHA token."),
    'failed_recaptcha_verification': gettext_lazy("Failed reCAPTCHA verification. Please try again."),
    'no_records_found' : gettext_lazy('No record found!'),
}

SUCCESS_MESSAGES = {
    'operation_successful': gettext_lazy("Operation completed successfully."),
    'fix_following_error': gettext_lazy('Please fix the following error.'),
    'upload_success': gettext_lazy('Files uploaded successfully.'),
    'org_registration_success': gettext_lazy('Orgnization has been registered successfully.'),
}
