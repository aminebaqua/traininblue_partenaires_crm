from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    lead,
    action,
    offre,
    relation,
    facture,
    deal,
    profil,
    commission,
    auth,
    stats,
    users,
    profile as profile_view,
)

router = DefaultRouter()
router.register(r"leads", lead.LeadViewSet, basename="lead")
router.register(r"actions", action.ActionViewSet, basename="action")
router.register(r"offres", offre.OffreViewSet, basename="offre")
router.register(r"relations", relation.RelationViewSet, basename="relation")
router.register(r"factures", facture.FactureViewSet, basename="facture")
router.register(r"deals", deal.DealViewSet, basename="deal")
router.register(r'current-user', users.CurrentUserViewSet, basename='current-user')
router.register(r"commissions", commission.CommissionViewSet, basename="commission")

urlpatterns = [
    path("signup/", auth.signup, name="signup"),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", profile_view.profile, name="profile"),
    path("dashboard-stats/", stats.dashboard_stats, name="dashboard_stats"),
    # path("users/emails/", users.users_emails, name="users-emails"),
    # path("users/", users.all_users, name="all_users"),
    # path("leads/", lead.user_leads, name="leads"),
    # path('api/deals/available_leads/', deal.DealViewSet.as_view({
    #     'get': 'available_leads'
    # }), name='deal-available-leads'),
    # path('leads/<int:pk>/', lead.lead_detail, name='lead-detail'),  # ✅ int:pk
    path("", include(router.urls)),
]
