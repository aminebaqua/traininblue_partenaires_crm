# serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Lead, Action, Offre, Relation, Facture, Deal, Profil, Commission
from django.contrib.auth import get_user_model
import re

User = get_user_model()

class LeadSerializer(serializers.ModelSerializer):
    # show created_by as id and username read-only
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id", "company_name", "contact_name", "email", "phone", "siret",
            "status", "notes", "declared_at", "created_at", "created_by",
            "created_by_username",
        ]
        read_only_fields = ["id", "created_at", "created_by", "created_by_username"]

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not validated_data.get("declared_at"):
            validated_data["declared_at"] = timezone.now()
        # set created_by to request.user if available
        if user and user.is_authenticated:
            validated_data["created_by"] = user
        return super().create(validated_data)
    

class LeadUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = [
            "company_name", "contact_name", "email", "phone", "siret",
            "status", "notes"
        ]
    
    def validate_siret(self, value):
        """Validation personnalisée pour SIRET"""
        if value and len(value) != 14:
            raise serializers.ValidationError("Le SIRET doit contenir exactement 14 chiffres")
        if value and not value.isdigit():
            raise serializers.ValidationError("Le SIRET ne doit contenir que des chiffres")
        return value
    
    def validate_phone(self, value):
        """Validation personnalisée pour le téléphone"""
        if value and not re.match(r'^\+?1?\d{9,15}$', value):
            raise serializers.ValidationError("Format de téléphone invalide")
        return value
    
    def validate_email(self, value):
        """Validation d'email"""
        if not value:
            raise serializers.ValidationError("L'email est obligatoire")
        return value
    
    def validate_company_name(self, value):
        """Validation du nom d'entreprise"""
        if not value:
            raise serializers.ValidationError("Le nom de l'entreprise est obligatoire")
        return value
    
    def validate_contact_name(self, value):
        """Validation du nom du contact"""
        if not value:
            raise serializers.ValidationError("Le nom du contact est obligatoire")
        return value
#  *************************************************************
class OffreInfoSerializer(serializers.ModelSerializer):
    """Serializer pour les informations d'offre"""
    class Meta:
        model = Offre
        fields = ['id', 'nom', 'plan_commission', 'taux_commission']

class RelationInfoSerializer(serializers.ModelSerializer):
    """Serializer pour les informations de relation dans les deals"""
    offre_info = OffreInfoSerializer(source='offre', read_only=True)
    
    class Meta:
        model = Relation
        fields = ['id', 'commercial', 'lead', 'offre', 'statut']

class DealSerializer(serializers.ModelSerializer):
    # plan_commission = serializers.SerializerMethodField()
    # taux_commission = serializers.SerializerMethodField()
    
    class Meta:
        model = Deal
        fields = [
            'id',
            'nom_deal',
            # 'nom_entreprise', 
            'stage',
            'type_deal',
            'montant',
            'notes',
            'remporte_le',
            'created_at',
            'updated_at',
            'relation',
            'facture',
            # 'plan_commission',  # Champ calculé
            'taux_commission',  # Champ calculé
            'date_paiment_client', 
            'date_paiment_commission'
        ]
        read_only_fields = ['created_at', 'updated_at', 'remporte_le']

    # def get_plan_commission(self, obj):
    #     """Récupère le plan_commission depuis l'offre via la relation"""
    #     if obj.relation and obj.relation.offre:
    #         return obj.relation.offre.plan_commission
    #     return None

    # def get_taux_commission(self, obj):
    #     """Récupère le taux_commission depuis l'offre via la relation"""
    #     if obj.relation and obj.relation.offre:
    #         return obj.relation.offre.taux_commission
    #     return None

# *************************************************************

class ActionSerializer(serializers.ModelSerializer):
    commercial_name = serializers.CharField(source='commercial.username', read_only=True)
    lead_company = serializers.CharField(source='lead.company_name', read_only=True)
    lead_contact = serializers.CharField(source='lead.contact_name', read_only=True)
    
    class Meta:
        model = Action
        fields = [
            'id', 
            'lead', 
            'commercial', 
            'action_type', 
            'date_echeance',
            'realise_le', 
            'titre', 
            'notes', 
            'priorite', 
            'statut',
            'created_at', 
            'updated_at', 
            'commercial_name', 
            'lead_company',
            'lead_contact'
        ]
        read_only_fields = ['created_at', 'updated_at', 'commercial', 'realise_le']

    def validate_date_echeance(self, value):
        """Validation de la date d'échéance"""
        print("===========>",value)
        if value < timezone.now():
            raise serializers.ValidationError("La date d'échéance ne peut pas être dans le passé.")
        return value

    def validate(self, data):
        """Validation globale"""
        if data.get('statut') == 'terminee' and not data.get('realise_le'):
            data['realise_le'] = timezone.now()
        return data


    def create(self, validated_data):
        """Assigner automatiquement le commercial connecté"""
        validated_data['commercial'] = self.context['request'].user
        return super().create(validated_data)

class OffreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offre
        fields = '__all__'

class RelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Relation
        fields = '__all__'

class FactureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facture
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='profil.telephone', read_only=True)
    company = serializers.CharField(source='profil.entreprise', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'date_joined', 'phone', 'company']
        read_only_fields = ['id', 'email', 'date_joined']


class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commission
        fields = '__all__'
