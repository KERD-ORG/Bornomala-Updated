import os

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'emails')], 
        ...
    },
]


EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.mailtrap.io'
EMAIL_HOST_USER = 'utpol1984@gmail.com'
EMAIL_HOST_PASSWORD = 'Bossman1@'
EMAIL_PORT = 2525
EMAIL_USE_TLS = True