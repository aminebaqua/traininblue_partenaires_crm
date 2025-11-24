from rest_framework import viewsets, permissions, filters
from ..models import Lead
from ..serializers import LeadSerializer, LeadUpdateSerializer
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status

class LeadViewSet(viewsets.ModelViewSet):
    # ✅ CHANGEMENT: Utiliser get_serializer_class au lieu de serializer_class fixe
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ["declared_at", "created_at"]
    ordering = ["-declared_at"]
    search_fields = ["company_name", "contact_name", "email", "siret"]

    def get_serializer_class(self):
        # ✅ Retourner le serializer approprié selon l'action
        if self.action in ['update', 'partial_update']:
            return LeadUpdateSerializer
        return LeadSerializer

    def get_queryset(self):
        # return only leads created by the requesting user
        user = self.request.user
        return Lead.objects.filter(created_by=user).order_by("-declared_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    # ✅ OPTIONNEL: Surcharger update pour un meilleur contrôle
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Retourner les données complètes après mise à jour
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        # Retourner avec le serializer complet pour avoir tous les champs
        full_serializer = LeadSerializer(instance, context={'request': request})

        return Response(full_serializer.data)


@api_view(['GET', 'POST']) 
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_leads(request):
    """
    Retourne tous les leads de l'utilisateur connecté
    """
    print('***************user_leads****************')
    if request.method =="GET":
        try:
            # Filtrer les leads par l'utilisateur connecté
            leads = Lead.objects.filter(created_by=request.user)
            
            # Sérialiser les données
            serializer = LeadSerializer(leads, many=True)
            print('tryyyyyyyyyyyyyyyyyyyyyy')
            return Response({
                'success': True,
                'leads': serializer.data,
                'count': leads.count()
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print('exceeeeeeeeeeeeeeept')
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    elif request.method == 'POST':
        print("POSTPOST")
        mutable_data = request.data
        print("mutable_data====>", mutable_data)
        try:
            # Ajouter l'utilisateur connecté aux données
            mutable_data = request.data.copy()
            print("mutable_data====>", mutable_data)
            serializer = LeadSerializer(data=mutable_data, context={'request': request})
            
            if serializer.is_valid():
                # Sauvegarder avec l'utilisateur connecté
                lead = serializer.save(created_by=request.user)
                
                # Retourner les données complètes
                full_serializer = LeadSerializer(lead)
                
                return Response({
                    'success': True,
                    'lead': full_serializer.data,
                    'message': 'Lead créé avec succès'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': 'Données invalides',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def lead_detail(request, pk):
    """
    Opérations CRUD sur un lead spécifique
    """
    try:
        # S'assurer que l'utilisateur ne peut accéder qu'à ses propres leads
        lead = Lead.objects.get(id=pk, created_by=request.user)
        
    except Lead.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Lead non trouvé'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = LeadSerializer(lead)
        return Response({
            'success': True,
            'lead': serializer.data
        })
    
    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        
        # ✅ CORRECTION: Utiliser LeadUpdateSerializer pour PUT/PATCH
        serializer = LeadUpdateSerializer(
            lead, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            # ✅ Retourner les données complètes avec LeadSerializer
            full_serializer = LeadSerializer(lead)
            return Response({
                'success': True,
                'lead': full_serializer.data,
                'message': 'Lead mis à jour avec succès'
            })
        else:
            return Response({
                'success': False,
                'error': 'Données invalides',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        lead.delete()
        return Response({
            'success': True,
            'message': 'Lead supprimé avec succès'
        }, status=status.HTTP_204_NO_CONTENT)