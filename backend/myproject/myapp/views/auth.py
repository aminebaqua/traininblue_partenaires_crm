import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.http import require_POST
from ..models import Profil

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    print(refresh)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

@csrf_exempt
@require_POST
def signup(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email = data.get("email")
    password = data.get("password")
    full_name = data.get("fullName") or ""
    company = data.get("company") or ""

    if not email or not password:
        return JsonResponse({"error": "email and password are required"}, status=400)

    if User.objects.filter(username=email).exists():
        return JsonResponse({"error": "Email already used"}, status=400)

    # Split full_name into first_name and last_name
    first_name, last_name = (full_name.split(" ", 1) + [""])[:2]

    user = User.objects.create(
        username=email,
        email=email,
        password=make_password(password),
        first_name=first_name,
        last_name=last_name,
    )

    # Create a profile for the user
    Profil.objects.create(user=user, entreprise=company)

    tokens = get_tokens_for_user(user)
    return JsonResponse(tokens, status=201)
