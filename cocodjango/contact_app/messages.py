from django.utils.translation import gettext_lazy as _

ERROR_MESSAGES = {
    'failed_save_contact_us_form_data': _('Failed to save data from form.'),
    'email_invalid': _('Enter a valid email address.'),
    'full_name_required': _('Full name is required.'),
    'message_required': _('Message is required.'),
     'missing_recaptcha_token': _("Missing reCAPTCHA token."),
    'failed_recaptcha_verification': _("Failed reCAPTCHA verification. Please try again."),
}

SUCCESS_MESSAGES = {
    'contact_us_saved_success': _('Thank you! Your message has been submitted successfully. We will get back to you soon.'),
}
