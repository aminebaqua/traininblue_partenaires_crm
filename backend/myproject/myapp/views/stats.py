from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from rest_framework.response import Response
from ..models import Lead, Deal

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    print("===>", user)
    total_leads = Lead.objects.filter(created_by=user).count()
    active_deals = Deal.objects.filter(relation__commercial=user, stage__in=["prospection", "négociation"]).count()
    won_deals = Deal.objects.filter(relation__commercial=user, stage="gagne").count()
    # total_commissions = Commission.objects.filter(commercial=user).aggregate(total=Sum('montant_commission'))['total'] or 0

    return Response({
        "totalLeads": total_leads,
        "activeDeals": active_deals,
        "wonDeals": won_deals,
    })
