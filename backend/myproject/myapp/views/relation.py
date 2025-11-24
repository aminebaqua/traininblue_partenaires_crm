from rest_framework import viewsets, permissions
from ..models import Relation
from ..serializers import RelationSerializer

class RelationViewSet(viewsets.ModelViewSet):
    serializer_class = RelationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Relation.objects.filter(commercial=user)

    def perform_create(self, serializer):
        serializer.save(commercial=self.request.user)
