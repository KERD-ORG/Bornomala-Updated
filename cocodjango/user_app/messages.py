from django.utils.translation import gettext_lazy

ERROR_MESSAGES = {
    'failed_update_profile': gettext_lazy('Failed to update profile details.'),
    'user_details_not_found': gettext_lazy('User details not found.'),
    'user_not_authenticated': gettext_lazy('User not authenticated.'),
    'organization_data_not_found': gettext_lazy('Organization data not found.'),
    'user_data_not_found':gettext_lazy('user data not found.')
}

SUCCESS_MESSAGES = {
    'educational_organization_saved_success': gettext_lazy('Educational organization saved successfully.'),
    'educational_organization_updated_success': gettext_lazy('Educational organization updated successfully.'),
    'user_details_found': gettext_lazy('User details retrieved successfully.'),
    'organization_data_found': gettext_lazy('Organization data found successfully.'),
    'user_saved_success': gettext_lazy('user saved successfully.'),
    'user_data_found': gettext_lazy('user data found successfully.'),
    'user_updated_success': gettext_lazy('user updated successfully.')
    
}
