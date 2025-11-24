# from rest_framework import viewsets, permissions
# from ..models import Profil
# from ..serializers import ProfilSerializer

# class ProfilViewSet(viewsets.ModelViewSet):
#     serializer_class = ProfilSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         return Profil.objects.filter(user=user)
