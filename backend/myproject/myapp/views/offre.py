from rest_framework import viewsets, permissions
from ..models import Offre
from ..serializers import OffreSerializer

class OffreViewSet(viewsets.ModelViewSet):
    queryset = Offre.objects.all()
    serializer_class = OffreSerializer
    permission_classes = [permissions.IsAuthenticated]
