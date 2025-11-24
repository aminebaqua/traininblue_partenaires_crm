from pathlib import Path
from datetime import timedelta
import os

# BASE DIR
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY
SECRET_KEY = "replace-this-with-env-secret-in-prod"
DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

# APPLICATION DEFINITIONS
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third Party
    "rest_framework",
    "corsheaders",
    'rest_framework_simplejwt',
    # Your app
    "myapp",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "myproject.urls"

# Custom User Model
# AUTH_USER_MODEL = "myapp.User"

# TEMPLATES CONFIG (مهم جدًا للـ admin)
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# DATABASE (يمكنك تعديلها لاحقًا)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# PASSWORD VALIDATION
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# LANGUAGE & TIME
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# STATIC FILES
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

# CORS ALLOWED
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",
]

# DJANGO REST FRAMEWORK + JWT
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # ✅
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',  # ✅
    ],
    'DATETIME_INPUT_FORMATS': [
        "%Y-%m-%dT%H:%M:%S.%fZ",  # Accept 2025-11-21T09:21:00.000Z
        "%Y-%m-%dT%H:%M:%S",      # Accept 2025-11-21T09:21:00
        "%Y-%m-%d %H:%M:%S",      # Accept 2025-11-21 09:21:00
    ]
}

# Assurez-vous que SimpleJWT est installé
# pip install djangorestframework-simplejwt

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
