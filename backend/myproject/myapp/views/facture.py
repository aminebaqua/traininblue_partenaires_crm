from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from ..models import Facture
from ..serializers import FactureSerializer

class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.all().select_related('commercial', 'deal')
    serializer_class = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return only invoices for the current user"""
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            queryset = queryset.filter(commercial=self.request.user)
        return queryset.order_by('-date_facture')

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_file(self, request, pk=None):
        """Upload a file to a specific invoice."""
        try:
            facture = self.get_object()
        except Facture.DoesNotExist:
            return Response({'error': 'Facture not found'}, status=status.HTTP_404_NOT_FOUND)

        if 'fichier' not in request.data:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.data['fichier']
        facture.fichier = file
        facture.save()

        serializer = self.get_serializer(facture)
        return Response(serializer.data, status=status.HTTP_200_OK)