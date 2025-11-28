from rest_framework import viewsets, permissions
from ..models import Deal, Relation, Facture
from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from ..serializers import DealSerializer, FactureSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from datetime import timedelta
from django.db import transaction


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
        

    @action(detail=False, methods=['get'])
    def commissions(self, request):
        """Get won deals for commissions page (without invoices)"""
        try:
            queryset = self.get_queryset().filter(
                stage='gagne',
                facture__isnull=True  # Only deals without invoices
            ).select_related(
                'relation__lead', 
                'relation__offre',
                'facture'
            )
            
            # Apply filtering and ordering
            queryset = self.filter_queryset(queryset)
            
            # Pagination if needed
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"❌ Erreur dans commissions: {str(e)}")
            return Response(
                {"error": "Erreur lors du chargement des commissions"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=False, methods=['post'])
    def create_facture_from_deals(self, request):
        """Create invoice from selected deals"""
        deal_ids = request.data.get('deal_ids', [])
        
        if not deal_ids:
            return Response(
                {'error': 'Veuillez sélectionner au moins un deal'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Get selected deals (only those belonging to current user and without invoice)
                deals = Deal.objects.filter(
                    id__in=deal_ids,
                    relation__commercial=request.user,  # Security: user owns these deals
                    stage='gagne',
                    facture__isnull=True
                )
                
                if not deals:
                    return Response(
                        {'error': 'Aucun deal valide trouvé'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Calculate total amounts
                total_montant_ht = sum(deal.montant or 0 for deal in deals)
                total_montant_ttc = total_montant_ht * 1.2  # Assuming 20% TVA
                
                # Generate invoice number
                from datetime import datetime, timedelta
                invoice_count = Facture.objects.count() + 1
                invoice_number = f"FACT-{datetime.now().strftime('%Y%m%d')}-{invoice_count:04d}"
                
                # Create invoice
                facture = Facture.objects.create(
                    commercial=request.user,
                    numero_facture=invoice_number,
                    montant_ht=total_montant_ht,
                    montant_ttc=total_montant_ttc,
                    date_facture=datetime.now().date(),
                    date_echeance=datetime.now().date() + timedelta(days=30),  # 30 days due date
                    statut_paiement='pending'
                )
                
                # Update deals with the invoice
                deals.update(facture=facture)
                
                # Serialize the invoice with deals - use correct import path
                # from .serializers import FactureSerializer  # Adjust path if needed
                serializer = FactureSerializer(facture, context={'request': request})
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            print(f"❌ Erreur création facture: {str(e)}")
            return Response(
                {'error': f'Erreur lors de la création de la facture: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # @action(detail=False, methods=['post'])
    # def create_facture_from_deals(self, request):
    #     """Create invoice from selected deals"""
    #     deal_ids = request.data.get('deal_ids', [])
        
    #     if not deal_ids:
    #         return Response(
    #             {'error': 'Veuillez sélectionner au moins un deal'},
    #             status=status.HTTP_400_BAD_REQUEST
    #         )
        
    #     try:
    #         with transaction.atomic():
    #             # Get selected deals (only those belonging to current user and without invoice)
    #             deals = Deal.objects.filter(
    #                 id__in=deal_ids,
    #                 relation__commercial=request.user,  # Security: user owns these deals
    #                 stage='gagne',
    #                 facture__isnull=True
    #             )
                
    #             if not deals:
    #                 return Response(
    #                     {'error': 'Aucun deal valide trouvé'},
    #                     status=status.HTTP_400_BAD_REQUEST
    #                 )
                
    #             # Calculate total amounts
    #             total_montant_ht = sum(deal.montant or 0 for deal in deals)
    #             total_montant_ttc = total_montant_ht * 1.2  # Assuming 20% TVA
                
    #             # Generate invoice number
    #             from datetime import datetime
    #             invoice_count = Facture.objects.count() + 1
    #             invoice_number = f"FACT-{datetime.now().strftime('%Y%m%d')}-{invoice_count:04d}"
                
    #             # Create invoice
    #             facture = Facture.objects.create(
    #                 commercial=request.user,
    #                 numero_facture=invoice_number,
    #                 montant_ht=total_montant_ht,
    #                 montant_ttc=total_montant_ttc,
    #                 date_facture=datetime.now().date(),
    #                 date_echeance=datetime.now().date() + timedelta(days=30),  # 30 days due date
    #                 statut_paiement='pending'
    #             )
                
    #             # Update deals with the invoice
    #             deals.update(facture=facture)
                
    #             # Serialize the invoice with deals
    #             from ..serializers import FactureSerializer
    #             serializer = FactureSerializer(facture, context={'request': request})
    #             return Response(serializer.data, status=status.HTTP_201_CREATED)
                
    #     except Exception as e:
    #         print(f"❌ Erreur création facture: {str(e)}")
    #         return Response(
    #             {'error': f'Erreur lors de la création de la facture: {str(e)}'},
    #             status=status.HTTP_500_INTERNAL_SERVER_ERROR
    #         )
