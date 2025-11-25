from rest_framework import viewsets, permissions, filters
from ..models import Lead, Relation, Offre
from ..serializers import LeadSerializer, LeadUpdateSerializer
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action


class LeadViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ["declared_at", "created_at"]
    ordering = ["-declared_at"]
    search_fields = ["company_name", "contact_name", "email", "siret"]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return LeadUpdateSerializer
        return LeadSerializer

    def get_queryset(self):
        user = self.request.user
        return Lead.objects.filter(created_by=user).order_by("-declared_at")

    def perform_create(self, serializer):
        # Save the lead first
        lead = serializer.save(created_by=self.request.user)
        
        # ✅ Automatically create a Relation for this lead with selected offer
        self.create_relation_for_lead(lead)

    def create_relation_for_lead(self, lead):
        """
        Automatically create a Relation when a Lead is created with selected offer
        """
        try:
            # ✅ Get the offer from the lead instance (stored by serializer)
            offre = getattr(lead, '_offre', None)
            
            if not offre:
                # Fallback: get any active offer
                offre = Offre.objects.filter(actif=True).first()
                if not offre:
                    # Create a default offer if none exists
                    offre = Offre.objects.create(
                        nom_offre="Offre Standard",
                        plan_commission="one_shot",
                        taux_commission=15.00,
                        actif=True
                    )
            
            # Create the relation
            relation = Relation.objects.create(
                lead=lead,
                commercial=self.request.user,
                offre=offre,
                statut='active'
            )
            
            print(f"✅ Relation created: {relation.id} for Lead: {lead.company_name} with Offer: {offre.nom_offre}")
            
        except Exception as e:
            print(f"❌ Error creating relation for lead {lead.id}: {str(e)}")

    # ✅ API endpoint for available offers
    @action(detail=False, methods=['get'], url_path='available-offres')
    def available_offres(self, request):
        """Get all active offers for the lead creation form"""
        offres = Offre.objects.filter(actif=True)
        data = [
            {
                'id': offre.id,
                'nom_offre': offre.nom_offre,
                'plan_commission': offre.plan_commission,
                'taux_commission': float(offre.taux_commission),
            }
            for offre in offres
        ]
        return Response(data)
