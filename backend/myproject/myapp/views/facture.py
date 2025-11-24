from rest_framework import viewsets, permissions
from ..models import Facture
from ..serializers import FactureSerializer

class FactureViewSet(viewsets.ModelViewSet):
    serializer_class = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Facture.objects.filter(commercial=user)

    def perform_create(self, serializer):
        serializer.save(commercial=self.request.user)
