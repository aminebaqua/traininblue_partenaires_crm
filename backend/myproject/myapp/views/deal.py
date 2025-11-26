from rest_framework import viewsets, permissions
from ..models import Deal, Relation
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from ..serializers import DealSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action

class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['stage', 'type_deal', 'relation']
    ordering_fields = ['created_at', 'montant', 'stage']
    ordering = ['-created_at']
    search_fields = ['nom_deal', 'relation__lead__company_name', 'notes']

    def get_queryset(self):
        """
        Retourne uniquement les deals où l'utilisateur connecté 
        est le commercial de la relation associée
        """
        queryset = Deal.objects.all().select_related(
            'relation__offre', 
            'relation__commercial', 
            'relation__lead'
        )
        
        if self.request.user.is_authenticated:
            queryset = queryset.filter(relation__commercial=self.request.user)
        
        return queryset.order_by('-created_at')

    def get_serializer_context(self):
        """Passer le contexte (request) au serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def available_relations(self, request):
        """Get relations that can be used to create deals"""
        try:
            user_relations = Relation.objects.filter(
                commercial=request.user,
                statut='active'
            ).select_related('lead', 'offre')
            
            relations_data = []
            for relation in user_relations:
                if relation.lead:  # S'assurer que le lead existe
                    relations_data.append({
                        'id': str(relation.id),  # ✅ Convertir en string pour le frontend
                        'company_name': relation.lead.company_name,
                        'contact_name': relation.lead.contact_name,
                        'email': relation.lead.email,
                        'offre_nom': relation.offre.nom_offre,
                        'plan_commission': relation.offre.plan_commission,
                        'taux_commission': float(relation.offre.taux_commission) if relation.offre.taux_commission else None
                    })
            
            print(f"✅ Relations disponibles envoyées: {len(relations_data)} relations")
            return Response(relations_data)
            
        except Exception as e:
            print(f"❌ Erreur dans available_relations: {str(e)}")
            return Response(
                {"error": "Erreur lors du chargement des relations"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        print("=== DEBUG CREATE DEAL ===")
        print("Données reçues:", request.data)
        print("Utilisateur:", request.user.username)
        
        try:
            # Vérifier si la relation existe et appartient à l'utilisateur
            relation_id = request.data.get('relation')
            if not relation_id:
                return Response(
                    {"relation": ["La relation commerciale est obligatoire."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                relation = Relation.objects.get(
                    id=relation_id, 
                    commercial=request.user  # ✅ SECURITY: Ensure user owns this relation
                )
                print(f"✅ Relation trouvée: {relation.id} - {relation.lead.company_name if relation.lead else 'No Lead'}")
            except Relation.DoesNotExist:
                print(f"❌ Relation non trouvée ou non autorisée avec ID: {relation_id}")
                return Response(
                    {"relation": ["La relation spécifiée n'existe pas ou vous n'y avez pas accès."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Préparer les données pour le serializer
            data = request.data.copy()
            
            # S'assurer que le serializer a le contexte avec la request
            serializer = self.get_serializer(data=data)
            
            print("Serializer valide?", serializer.is_valid())
            if not serializer.is_valid():
                print("❌ Erreurs de validation:", serializer.errors)
                return Response(
                    {"error": "Erreur de validation", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Créer l'instance
            instance = serializer.save()
            print(f"✅ Deal créé avec succès: {instance.id} - {instance.nom_deal}")
            
            # Retourner les données avec les relations
            response_serializer = self.get_serializer(instance)
            headers = self.get_success_headers(response_serializer.data)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print(f"❌ Erreur inattendue: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": "Erreur serveur interne", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )