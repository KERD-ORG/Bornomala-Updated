# history_metadata.py

# Define constants for history types
OTP_HISTORY_TYPE = 'OTP'
REGISTRATION_HISTORY_TYPE = 'Registration'


# Define functions for generating history reasons
def generate_otp_setup_reason():
    return 'OTP setup'

def generate_otp_disable_reason():
    return 'OTP disabled'

def generate_otp_verify_reason():
    return 'OTP verified'

def generate_otp_verification_fail_reason(reason=None):
    if not reason:
        reason = 'OTP verification failed at login'
    return reason

def generate_registration_reason():
    return 'New user registered'

def generate_user_activate_reason():
    return 'New user activated'

def generate_password_reset_token_generation_reason():
    return 'Password reset token is generated'

def generate_password_reset_confirm_reason():
    return 'Password reset is successful'

def generate_role_assignment_reason(role):
    if role:
        return f'New user registered and Assigned to role: {role}'
    else:
        return 'New user registered and Role assignment unspecified'
    

def generate_user_login():
    return 'User login'

def generate_user_logout():
    return 'User logout'

def generate_user_login_failed():
    return 'User login failed with wrong password'


# contact app
def generate_contact_creation_reason():
    return "Contact us form data created"
def generate_user_locked():
    return 'User is locked for multiple failed login attempt'
