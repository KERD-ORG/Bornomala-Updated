from django.utils.translation import gettext_lazy

ERROR_MESSAGES = {
    'failed_update_profile': gettext_lazy('Failed to update profile details.'),
    'user_details_not_found': gettext_lazy('User details not found.'),
    'user_not_authenticated': gettext_lazy('User not authenticated.'),
}

SUCCESS_MESSAGES = {
    'profile_saved_success': gettext_lazy('Profile details data saved successfully.'),
    'profile_updated_success': gettext_lazy('Profile details data updated successfully.'),
    'user_details_found': gettext_lazy('User details retrieved successfully.'),
}
