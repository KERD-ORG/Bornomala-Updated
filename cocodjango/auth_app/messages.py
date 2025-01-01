from django.utils.translation import gettext_lazy

ERROR_MESSAGES = {
    'invalid_credentials_email': gettext_lazy("Email or password is wrong."),
    'invalid_credentials_username': gettext_lazy("Username or password is wrong."),
    'otp_incorrect': gettext_lazy("The OTP code you entered is incorrect. Please try again."),
    'user_not_found': gettext_lazy("User not found."),
    
    'missing_recaptcha_token': gettext_lazy("Missing reCAPTCHA token."),
    'failed_recaptcha_verification': gettext_lazy("Failed reCAPTCHA verification. Please try again."),
    
    'This field is required.': gettext_lazy("This field is required."),
    'This field may not be blank.': gettext_lazy("This field may not be blank."),
    'Enter a valid email address.': gettext_lazy("Enter a valid email address."),
    'A user with that email already exists.': gettext_lazy("A user with that email already exists."),
    
    'This password is too short.': gettext_lazy("This password is too short."),
    'It must contain at least 8 characters.': gettext_lazy("It must contain at least 8 characters."),
    'This password is entirely numeric.': gettext_lazy("This password is entirely numeric."),
    'This password is too common.': gettext_lazy("This password is too common."),
    'Account locked due to too many failed login attempts.': gettext_lazy("Account locked due to too many failed login attempts.")
   
    
}

SUCCESS_MESSAGES = {
    'login_successful': gettext_lazy("Login successful."),
    'registration_successful': gettext_lazy("Registration successful."),
    
    'user_created_successfully': gettext_lazy("User created successfully."),
    'failed_to_send_welcome_email': gettext_lazy("User created successfully but failed to send welcome email."),
   
}
