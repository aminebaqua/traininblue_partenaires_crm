# serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Lead, Action, Offre, Relation, Facture, Deal, Profil
from django.contrib.auth import get_user_model
import re
from django.utils import timezone

User = get_user_model()

class LeadSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by_username = serializers.SerializerMethodField(read_only=True)
    
    # Champ pour l'écriture
    offre_id = serializers.PrimaryKeyRelatedField(
        queryset=Offre.objects.filter(actif=True),
        write_only=True,
        required=False,
        source='offre'
    )
    
    # ✅ CORRECTION: Récupérer l'offre depuis la relation
    current_offre_id = serializers.SerializerMethodField(read_only=True)
    offre_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id", "company_name", "contact_name", "email", "phone", "siret",
            "status", "notes", "declared_at", "created_at", "created_by",
            "created_by_username", "offre_id", "current_offre_id", "offre_details"
        ]
        read_only_fields = ["id", "created_at", "created_by", "created_by_username"]

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None
    
    def get_current_offre_id(self, obj):
        """Récupérer l'ID de l'offre depuis la relation"""
        try:
            # Trouver la relation associée à ce lead
            relation = Relation.objects.filter(lead=obj).first()
            if relation and relation.offre:
                return relation.offre.id
            return None
        except Exception:
            return None
    
    def get_offre_details(self, obj):
        """Récupérer les détails de l'offre depuis la relation"""
        try:
            # Trouver la relation associée à ce lead
            relation = Relation.objects.filter(lead=obj).first()
            if relation and relation.offre:
                return {
                    'id': relation.offre.id,
                    'nom': relation.offre.nom_offre,
                    'taux_commission': relation.offre.taux_commission,
                    'plan_commission': relation.offre.plan_commission,
                }
            return None
        except Exception as e:
            print(f"Error getting offre details: {e}")
            return None
    
    def create(self, validated_data):
        offre = validated_data.pop('offre', None)
        
        request = self.context.get("request")
        user = getattr(request, "user", None)
        
        if not validated_data.get("declared_at"):
            validated_data["declared_at"] = timezone.now()
            
        if user and user.is_authenticated:
            validated_data["created_by"] = user
            
        # Créer le lead
        lead = super().create(validated_data)
        
        # ✅ CRÉER LA RELATION si une offre est fournie
        if offre:
            try:
                Relation.objects.create(
                    lead=lead,
                    offre=offre,
                    commercial=user,  # ou le commercial approprié
                    # autres champs requis par votre modèle Relation
                )
            except Exception as e:
                print(f"Error creating relation: {e}")
            
        return lead
    
#  *************************************************************
class LeadUpdateSerializer(serializers.ModelSerializer):
    offre_id = serializers.PrimaryKeyRelatedField(
    queryset=Offre.objects.filter(actif=True),
    required=False,  # Optionnel pour la mise à jour
    source='offre'
    )
    class Meta:
        model = Lead
        fields = [
            "company_name", "contact_name", "email", "phone", "siret",
            "status", "notes", "offre_id"
        ]
    
    def validate_siret(self, value):
        """Validation personnalisée pour SIRET"""
        if value and len(value) != 9:
            raise serializers.ValidationError("Le SIRET doit contenir exactement 9 chiffres")
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
#  *************************************************************

class DealSerializer(serializers.ModelSerializer):
    nom_entreprise = serializers.CharField(source='relation.lead.company_name', read_only=True)
    lead_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Deal
        fields = [
            'id',
            'nom_deal',
            'nom_entreprise',
            'stage',
            'type_deal',
            'montant',
            'notes',
            'remporte_le',
            'created_at',
            'updated_at',
            'relation',
            'facture',
            'taux_commission',
            'date_paiment_client', 
            'date_paiment_commission',
            'lead_info'
        ]
        read_only_fields = ['created_at', 'updated_at', 'remporte_le', 'nom_entreprise']

    def get_lead_info(self, obj):
        """Return lead information for the React form"""
        if obj.relation and obj.relation.lead:
            return {
                'company_name': obj.relation.lead.company_name,
                'contact_name': obj.relation.lead.contact_name,
                'email': obj.relation.lead.email
            }
        return None

    def validate(self, data):
        """
        Validation to ensure the relation is valid.
        The relation is only required on creation.
        """
        # On creation (self.instance is None), 'relation' must be in the data.
        if self.instance is None and 'relation' not in data:
            raise serializers.ValidationError({
                "relation": ["La relation commerciale est obligatoire."]
            })

        # If 'relation' is provided in the payload (for create or update),
        # validate that the user has access to it.
        if 'relation' in data:
            relation = data.get('relation')
            request = self.context.get('request')

            if not relation:
                raise serializers.ValidationError({
                    "relation": ["La relation ne peut pas être nulle."]
                })
            
            if request and hasattr(relation, 'commercial'):
                if request.user != relation.commercial:
                    raise serializers.ValidationError({
                        "relation": ["Vous n'avez pas accès à cette relation."]
                    })
        
        return data

    def create(self, validated_data):
        """
        Création d'un deal avec gestion des valeurs par défaut
        et de la logique métier
        """
        # Récupérer la relation
        relation = validated_data.get('relation')
        
        print(f"🔄 Création du deal pour la relation: {relation.id}")
        
        # 1. Gestion du taux de commission
        if 'taux_commission' not in validated_data or validated_data['taux_commission'] is None:
            # Utiliser le taux de commission de l'offre de la relation
            if relation and relation.offre:
                validated_data['taux_commission'] = relation.offre.taux_commission
                print(f"📊 Taux de commission utilisé depuis l'offre: {relation.offre.taux_commission}")
            else:
                validated_data['taux_commission'] = 0
                print("📊 Taux de commission par défaut: 0")
        
        # 2. Déterminer automatiquement le type_deal si non fourni
        if not validated_data.get('type_deal'):
            if relation and relation.lead_id:
                # Vérifier si ce lead a déjà des deals durables
                existing_durable_deals = Deal.objects.filter(
                    relation__lead_id=relation.lead_id,
                    type_deal='durable'
                ).exists()
                
                if existing_durable_deals:
                    validated_data['type_deal'] = 'one_shot'
                    print("🎯 Type de deal déterminé: one_shot (déjà un deal durable existant)")
                else:
                    # Utiliser le plan de commission de l'offre comme indicateur
                    if relation.offre and relation.offre.plan_commission == 'durable':
                        validated_data['type_deal'] = 'durable'
                        print("🎯 Type de deal déterminé: durable (selon l'offre)")
                    else:
                        validated_data['type_deal'] = 'one_shot'
                        print("🎯 Type de deal déterminé: one_shot (par défaut)")
            else:
                validated_data['type_deal'] = 'one_shot'
                print("🎯 Type de deal par défaut: one_shot")
        
        # 3. Mettre à jour la date de dernière action de la relation
        if relation:
            relation.derniere_action = timezone.now()
            relation.save(update_fields=['derniere_action'])
            print("🕐 Date de dernière action de la relation mise à jour")
        
        # 4. Si le deal est gagné, mettre à jour la date de remport
        if validated_data.get('stage') == 'gagne' and not validated_data.get('remporte_le'):
            validated_data['remporte_le'] = timezone.now()
            print("🏆 Date de remport automatiquement définie")
        
        print(f"✅ Données validées pour la création: {validated_data}")
        
        try:
            # Créer l'instance
            instance = super().create(validated_data)
            
            # 5. Post-création: Mettre à jour le statut du lead si nécessaire
            if relation and relation.lead:
                if instance.stage == 'gagne':
                    relation.lead.status = 'converti'
                    relation.lead.save(update_fields=['status'])
                    print("🔄 Statut du lead mis à jour: converti")
                elif instance.stage == 'perdu':
                    relation.lead.status = 'perdu'
                    relation.lead.save(update_fields=['status'])
                    print("🔄 Statut du lead mis à jour: perdu")
            
            print(f"✅ Deal créé avec succès: {instance.id}")
            return instance
            
        except Exception as e:
            print(f"❌ Erreur lors de la création du deal: {str(e)}")
            raise serializers.ValidationError({
                "non_field_errors": [f"Erreur lors de la création du deal: {str(e)}"]
            })
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

    # def validate_date_echeance(self, value):
    #     """Validation de la date d'échéance"""
    #     print("===========>",value)
    #     if value < timezone.now():
    #         raise serializers.ValidationError("La date d'échéance ne peut pas être dans le passé.")
    #     return value

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
# *************************************************************
class FactureSerializer(serializers.ModelSerializer):
    deal = DealSerializer(read_only=True)
    commercial_name = serializers.CharField(source='commercial.get_full_name', read_only=True)
    
    class Meta:
        model = Facture
        fields = [
            'id', 'numero_facture', 'montant_ht', 'montant_ttc', 
            'date_facture', 'date_echeance', 'statut_paiement', 'fichier',
            'deal', 'commercial_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

# *************************************************************

class UserProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='profil.telephone', read_only=True)
    company = serializers.CharField(source='profil.entreprise', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'date_joined', 'phone', 'company']
        read_only_fields = ['id', 'email', 'date_joined']


