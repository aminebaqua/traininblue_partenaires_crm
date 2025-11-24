from rest_framework import viewsets, permissions
from django.contrib.auth.models import User
from ..models import Profil
from ..serializers import UserProfileSerializer
from rest_framework.response import Response

class CurrentUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing the currently authenticated user's profile
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only return the current user's data
        return User.objects.filter(id=self.request.user.id)
    
    def get_serializer_class(self):
        return UserProfileSerializer
    
    def list(self, request, *args, **kwargs):
        # Override list to return single user profile
        instance = self.request.user
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        # Ensure users can only retrieve their own profile
        if int(kwargs.get('pk')) != request.user.id:
            return Response({"detail": "Not found."}, status=404)
        return super().retrieve(request, *args, **kwargs)
    

# User = get_user_model()

# @api_view(["GET"])
# def users_emails(request):
#     """
#     Return a list of all user emails.
#     """
#     emails = list(User.objects.values_list('email', flat=True))
#     return Response({"emails": emails})

# @api_view(["GET"])
# def all_users(request):
#     users = User.objects.all().values(
#         "id", "username", "email", "first_name", "last_name"
#     )
#     return Response(list(users))
