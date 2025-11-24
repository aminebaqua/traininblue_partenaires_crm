from rest_framework import viewsets, permissions
from ..models import Commission
from ..serializers import CommissionSerializer

class CommissionViewSet(viewsets.ModelViewSet):
    serializer_class = CommissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Commission.objects.filter(commercial=user)
