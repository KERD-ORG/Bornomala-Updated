from django.utils.translation import gettext_lazy

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
    'college_data_not_found': gettext_lazy("College data not found.")
}

SUCCESS_MESSAGES = {
    'operation_successful': gettext_lazy("Operation completed successfully."),
    'upload_success': gettext_lazy('Files uploaded successfully.'),
    'college_data_found': gettext_lazy('College data found.'),
    'college_saved_successfully': gettext_lazy('College data saved successfully.'),
    'college_updated_successfully': gettext_lazy('College data updated successfully.')
}
