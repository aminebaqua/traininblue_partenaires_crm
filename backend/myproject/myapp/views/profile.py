from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..models import Profil

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user
    profil = Profil.objects.get(user=user)
    return Response({
        "email": user.email,
        "username": user.username,
        "full_name": f"{user.first_name} {user.last_name}",
        "company": profil.entreprise,
    })
