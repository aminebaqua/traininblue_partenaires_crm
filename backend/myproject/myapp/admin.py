from django.contrib import admin
from .models import Lead, Offre, Relation, Facture, Deal, Action, Profil, Commission

class LeadAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_by', 'company_name', 'contact_name', 'email', 'phone', 'siret', 'status', 'notes', 'declared_at', 'created_at', 'updated_at')

class OffreAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom_offre', 'plan_commission', 'taux_commission', 'actif', 'created_at', 'updated_at')

class RelationAdmin(admin.ModelAdmin):
    list_display = ('id', 'lead', 'commercial', 'offre', 'statut', 'created_at', 'updated_at')

class FactureAdmin(admin.ModelAdmin):
    list_display = ('id', 'commercial', 'numero_facture', 'montant_ht', 'montant_ttc', 'date_facture', 'date_echeance', 'statut_paiement', 'created_at', 'updated_at')

class DealAdmin(admin.ModelAdmin):
    list_display = ('id', 'facture', 'relation', 'nom_deal', 'type_deal', 'taux_commission', 'stage', 'montant', 'notes', 'remporte_le', 'date_paiment_client', 'date_paiment_commission','created_at', 'updated_at')

class ActionAdmin(admin.ModelAdmin):
    list_display = ('id', 'lead', 'commercial', 'action_type', 'date_echeance', 'realise_le', 'titre', 'notes', 'priorite', 'statut', 'created_at', 'updated_at')

class ProfilAdmin(admin.ModelAdmin):
    list_display = ('user', 'entreprise', 'telephone', 'created_at', 'updated_at')

class CommissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'deal', 'commercial', 'montant_commission', 'taux_commission', 'statut', 'date_paiement', 'created_at', 'updated_at')

admin.site.register(Lead, LeadAdmin)
admin.site.register(Offre, OffreAdmin)
admin.site.register(Relation, RelationAdmin)
admin.site.register(Facture, FactureAdmin)
admin.site.register(Deal, DealAdmin)
admin.site.register(Action, ActionAdmin)
admin.site.register(Profil, ProfilAdmin)
admin.site.register(Commission, CommissionAdmin)
