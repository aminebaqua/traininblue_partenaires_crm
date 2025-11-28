

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import EmailValidator, RegexValidator
import uuid

class Lead(models.Model):
    LEAD_STATUS_CHOICES = [
        ('nouveau', 'Nouveau'),
        ('en_cours', 'En Cours'),
        ('converti', 'Converti'),
        ('perdu', 'Perdu'),
    ]
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leads_created')
    company_name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255,unique=True,validators=[EmailValidator()])
    phone = models.CharField(max_length=20,blank=True,null=True,validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$')])
    siret = models.CharField(max_length=9,blank=True,null=True,validators=[RegexValidator(regex=r'^\d{9}$')],help_text="SIRET number (9 digits)")
    status = models.CharField(max_length=20,choices=LEAD_STATUS_CHOICES,default='nouveau')
    notes = models.TextField(blank=True, null=True)
    declared_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['company_name']),
        ]

    def __str__(self):
        return f"{self.company_name} - {self.contact_name}"

class Offre(models.Model):
    COMMISSION_PLAN_CHOICES = [
        ('one_shot', 'One-shot'),
        ('durable', 'Durable'),
    ]
    
    nom_offre = models.CharField(max_length=255)
    plan_commission = models.CharField(max_length=20,choices=COMMISSION_PLAN_CHOICES)
    taux_commission = models.DecimalField(max_digits=5, decimal_places=2,help_text="Commission rate in percentage (e.g., 20.00 for 20%)")
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # new
    condition_commission_additionel = models.CharField(max_length=255)

    class Meta:
        verbose_name_plural = "Offres"

    def __str__(self):
        return f"{self.nom_offre} ({self.plan_commission})"

class Relation(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('non_active', 'Non Active'),
    ]
    
    lead = models.ForeignKey(
        Lead, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='relations'
    )
    commercial = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='relations_commercial'
    )
    offre = models.ForeignKey(
        Offre, 
        on_delete=models.CASCADE,
        related_name='relations'
    )
    statut = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # new
    derniere_action = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['statut']),
            models.Index(fields=['commercial', 'statut']),
        ]
        # Correction du unique_together pour gérer les leads null
        constraints = [
            models.UniqueConstraint(
                fields=['lead', 'offre', 'commercial'],
                name='unique_relation_per_lead',
                condition=models.Q(lead__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['offre', 'commercial'],
                name='unique_relation_without_lead',
                condition=models.Q(lead__isnull=True)
            ),
        ]

    def __str__(self):
        return f"Relation {self.lead.company_name if self.lead else 'No Lead'} - {self.commercial.username}"

class Facture(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('paid', 'Payée'),
        ('cancelled', 'Annulée'),
        ('overdue', 'En retard'),
    ]
    
    commercial = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='factures_commercial'
    )
    numero_facture = models.CharField(
        max_length=50,
        unique=True
    )
    montant_ht = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Montant HT de la facture"
    )
    montant_ttc = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Montant TTC de la facture"
    )
    date_facture = models.DateField()
    date_echeance = models.DateField(blank=True, null=True)
    statut_paiement = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending'
    )
    fichier = models.FileField(upload_to='factures/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['statut_paiement']),
            models.Index(fields=['date_facture']),
        ]
        ordering = ['-date_facture']

    def __str__(self):
        return f"Facture {self.numero_facture}"

class Deal(models.Model):
    DEAL_STAGE_CHOICES = [
        ('prospection', 'Prospection'),
        # ('qualification', 'Qualification'),
        ('negociation', 'Négociation'),
        # ('contrat', 'Contrat'),
        ('gagne', 'Gagné'),
        ('perdu', 'Perdu'),
    ]
    
    DEAL_TYPE_CHOICES = [
        ('one_shot', 'One-shot'),
        ('durable', 'Durable'),
    ]
    
    facture = models.OneToOneField(
        Facture, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='deal'
    )
    relation = models.ForeignKey(
        Relation, 
        on_delete=models.CASCADE,
        related_name='deals'
    )
    nom_deal = models.CharField(max_length=255)
    # nom_entreprise = models.CharField(max_length=255)
    # à supprimer   
    type_deal = models.CharField(
        max_length=20,
        choices=DEAL_TYPE_CHOICES,
        default='one_shot'
    )
    stage = models.CharField(
        max_length=20,
        choices=DEAL_STAGE_CHOICES,
        default='prospection'
    )
    montant = models.IntegerField(
        blank=True, 
        null=True,
        help_text="Montant estimé du deal"
    )
    notes = models.TextField(blank=True, null=True)
    remporte_le = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # new fields
    taux_commission = models.IntegerField(blank=True, null=True)
    date_paiment_client = models.DateTimeField(blank=True, null=True)
    date_paiment_commission = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['stage']),
            models.Index(fields=['type_deal']),
            models.Index(fields=['remporte_le']),
        ]

    def __str__(self):
        return self.nom_deal

    def save(self, *args, **kwargs):
        # Business rule: Auto-determine deal type based on lead history
        if not self.type_deal and self.relation.lead_id:
            existing_deals = Deal.objects.filter(
                relation__lead_id=self.relation.lead_id,
                type_deal='durable'
            ).exists()
            if existing_deals:
                self.type_deal = 'one_shot'
        super().save(*args, **kwargs)

class Action(models.Model):
    ACTION_TYPE_CHOICES = [
        ('call', 'Appel'),
        ('email', 'Email'),
        ('meeting', 'Réunion'),
        ('other', 'Autre'),
    ]
    
    ACTION_STATUS_CHOICES = [
        ('en_attente', 'En attente'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
    ]
    
    lead = models.ForeignKey(
        Lead, 
        on_delete=models.CASCADE,
        related_name='actions'
    )
    commercial = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='actions_commercial'
    )
    action_type = models.CharField(
        max_length=20,
        choices=ACTION_TYPE_CHOICES
    )
    date_echeance = models.DateTimeField()
    realise_le = models.DateTimeField(blank=True, null=True)
    titre = models.CharField(max_length=255)
    notes = models.TextField(blank=True, null=True)
    priorite = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    statut = models.CharField(
        max_length=20,
        choices=ACTION_STATUS_CHOICES,
        default='en_attente'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['date_echeance']),
            models.Index(fields=['statut']),
            models.Index(fields=['commercial', 'date_echeance']),
        ]
        ordering = ['date_echeance']

    def __str__(self):
        return f"{self.titre} - {self.lead.company_name}"

class Profil(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        primary_key=True,
        related_name='profil'
    )
    entreprise = models.CharField(max_length=255, blank=True, null=True)
    telephone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$')]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Profils"

    def __str__(self):
        return f"Profil de {self.user.username}"

