from django.utils.translation import gettext_lazy as _


ERROR_MESSAGES = {
    'department_data_not_found': _('Department data not found.'),
    'fix_following_error': _('Please fix the following errors:'),
    'validation_error_occurred': _('Validation error occurred.'),
    'department_not_found': _('Department not found.'),
    'an_error_occurred_while_deleting': _('An error occurred while deleting the department.'),
}

SUCCESS_MESSAGES = {
    'department_data_found': _('Department data found successfully.'),
    'department_saved_success': _('Department saved successfully.'),
    'department_updated_success': _('Department updated successfully.'),
    'department_deleted_success': _('Department deleted successfully.'),
}
