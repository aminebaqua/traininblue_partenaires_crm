from rest_framework import viewsets, permissions
from ..models import Deal, Relation
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from ..serializers import DealSerializer
from rest_framework.response import Response
from rest_framework import status


class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['stage', 'type_deal', 'relation']
    ordering_fields = ['created_at', 'montant', 'stage']
    ordering = ['-created_at']
    search_fields = ['nom_deal', 'nom_entreprise', 'notes']

    # ✅ QUERYSET DE BASE AVEC OPTIMISATION
    queryset = Deal.objects.all().select_related('relation__offre', 'relation__commercial')
    
    def get_queryset(self):
        """
        Retourne uniquement les deals où l'utilisateur connecté 
        est le commercial de la relation associée
        """
        queryset = super().get_queryset()
        
        # ✅ FILTRAGE PAR UTILISATEUR CONNECTÉ
        if self.request.user.is_authenticated:
            queryset = queryset.filter(relation__commercial=self.request.user)
        
        return queryset.order_by('-created_at')

    # ✅ AJOUTER CETTE MÉTHODE POUR AVOIR LES ERREURS DÉTAILLÉES
    def create(self, request, *args, **kwargs):
        print("=== DEBUG CREATE DEAL ===")
        print("Données reçues:", request.data)
        print("Utilisateur:", request.user)
        
        try:
            # Vérifier si la relation existe
            relation_id = request.data.get('relation')
            if relation_id:
                try:
                    relation = Relation.objects.get(id=relation_id)
                    print("Relation trouvée:", relation)
                except Relation.DoesNotExist:
                    print("❌ Relation non trouvée avec ID:", relation_id)
                    return Response(
                        {"error": f"La relation avec l'ID {relation_id} n'existe pas."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer = self.get_serializer(data=request.data)
            print("Serializer valide?", serializer.is_valid())
            if not serializer.is_valid():
                print("❌ Erreurs de validation:", serializer.errors)
                return Response(
                    {"error": "Erreur de validation", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Créer l'instance
            instance = serializer.save()
            print("✅ Deal créé avec succès:", instance.id)
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print("❌ Erreur inattendue:", str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {"error": "Erreur serveur interne", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )