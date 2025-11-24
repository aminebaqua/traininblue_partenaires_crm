from rest_framework import viewsets, permissions, filters, status
from ..models import Action
from ..serializers import ActionSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone


class ActionViewSet(viewsets.ModelViewSet):
    serializer_class = ActionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['action_type', 'statut', 'priorite', 'lead']
    ordering_fields = ['date_echeance', 'priorite', 'created_at']
    ordering = ['date_echeance']
    search_fields = ['titre', 'notes', 'lead__company_name']
    
    def get_queryset(self):
        """Retourne les actions du commercial connecté"""
        queryset = Action.objects.all().select_related('lead', 'commercial')
        
        # Filtrer par commercial connecté
        if self.request.user.is_authenticated:
            queryset = queryset.filter(commercial=self.request.user)
            
        return queryset

    def perform_create(self, serializer):
        """S'assurer que le commercial est assigné"""
        serializer.save(commercial=self.request.user)

    @action(detail=True, methods=['post'])
    def marquer_terminee(self, request, pk=None):
        """Marquer une action comme terminée"""
        action = self.get_object()
        
        # Vérifier que l'utilisateur peut modifier cette action
        if action.commercial != request.user:
            return Response(
                {"error": "Vous n'avez pas la permission de modifier cette action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        action.statut = 'terminee'
        action.realise_le = timezone.now()
        action.save()
        
        serializer = self.get_serializer(action)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def marquer_annulee(self, request, pk=None):
        """Marquer une action comme annulée"""
        action = self.get_object()
        
        if action.commercial != request.user:
            return Response(
                {"error": "Vous n'avez pas la permission de modifier cette action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        action.statut = 'annulee'
        action.realise_le = timezone.now()
        action.save()
        
        serializer = self.get_serializer(action)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def actions_du_jour(self, request):
        """Récupérer les actions du jour"""
        aujourd_hui = timezone.now().date()
        actions = self.get_queryset().filter(
            date_echeance__date=aujourd_hui,
            statut='en_attente'
        )
        serializer = self.get_serializer(actions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def actions_en_retard(self, request):
        """Récupérer les actions en retard"""
        actions = self.get_queryset().filter(
            date_echeance__lt=timezone.now(),
            statut='en_attente'
        )
        serializer = self.get_serializer(actions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def actions_a_venir(self, request):
        """Récupérer les actions à venir (en attente)"""
        actions = self.get_queryset().filter(
            statut='en_attente'
        ).order_by('date_echeance')
        serializer = self.get_serializer(actions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques des actions"""
        queryset = self.get_queryset()
        
        total = queryset.count()
        terminees = queryset.filter(statut='terminee').count()
        en_attente = queryset.filter(statut='en_attente').count()
        annulees = queryset.filter(statut='annulee').count()
        en_retard = queryset.filter(
            date_echeance__lt=timezone.now(),
            statut='en_attente'
        ).count()
        
        return Response({
            'total': total,
            'terminees': terminees,
            'en_attente': en_attente,
            'annulees': annulees,
            'en_retard': en_retard,
            'taux_accomplissement': (terminees / total * 100) if total > 0 else 0
        })