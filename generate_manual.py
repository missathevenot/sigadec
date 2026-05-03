"""
Génération du Manuel d'Utilisation SIGADEC — PDF professionnel
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import Flowable
import os

# ── Palette couleurs SIGADEC ──────────────────────────────────────────────────
VERT_F   = colors.HexColor('#006837')
VERT_M   = colors.HexColor('#1A8A4A')
VERT_L   = colors.HexColor('#E8F5EE')
ORNG     = colors.HexColor('#D97706')
ORNG_L   = colors.HexColor('#FEF3C7')
URG      = colors.HexColor('#DC2626')
URG_B    = colors.HexColor('#FEF2F2')
BLEU     = colors.HexColor('#2563EB')
BLEU_L   = colors.HexColor('#EFF6FF')
GRIS_T   = colors.HexColor('#1E293B')
GRIS_SEC = colors.HexColor('#64748B')
GRIS_B   = colors.HexColor('#F4F6F9')
BLANC    = colors.white
BORD     = colors.HexColor('#E2E8F0')

OUTPUT_PATH = r"D:\MES LOGICIELS\SIGADEC\sigadec\Manuel_Utilisateur_SIGADEC.pdf"

# ── Séparateur décoratif ───────────────────────────────────────────────────────
class ColorLine(Flowable):
    def __init__(self, color=VERT_F, width=None, thickness=2):
        super().__init__()
        self._color = color
        self._width = width
        self._thickness = thickness
        self.height = thickness + 2

    def draw(self):
        w = self._width or self.canv._pagesize[0] - 4*cm
        self.canv.setStrokeColor(self._color)
        self.canv.setLineWidth(self._thickness)
        self.canv.line(0, 0, w, 0)


# ── Numérotation pages ─────────────────────────────────────────────────────────
def add_page_number(canvas, doc):
    canvas.saveState()
    # En-tête
    canvas.setFillColor(VERT_F)
    canvas.rect(0, A4[1] - 18*mm, A4[0], 18*mm, fill=True, stroke=False)
    canvas.setFillColor(BLANC)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(2*cm, A4[1] - 11*mm, "SIGADEC")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(A4[0] - 2*cm, A4[1] - 11*mm,
                           "Système Intégré de Gestion Administrative du Cadastre")

    # Pied de page
    canvas.setFillColor(GRIS_B)
    canvas.rect(0, 0, A4[0], 14*mm, fill=True, stroke=False)
    canvas.setFillColor(GRIS_SEC)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(2*cm, 5*mm, "Direction du Cadastre — DGI Côte d'Ivoire")
    canvas.drawRightString(A4[0] - 2*cm, 5*mm, f"Page {doc.page}")
    canvas.restoreState()


def first_page(canvas, doc):
    # Pas d'en-tête/pied sur la page de couverture
    pass


# ── Styles ─────────────────────────────────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()

    styles = {
        'cover_title': ParagraphStyle(
            'cover_title',
            fontName='Helvetica-Bold',
            fontSize=32,
            textColor=BLANC,
            alignment=TA_CENTER,
            spaceAfter=6,
            leading=38,
        ),
        'cover_sub': ParagraphStyle(
            'cover_sub',
            fontName='Helvetica',
            fontSize=14,
            textColor=colors.HexColor('#B7E4C7'),
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        'cover_detail': ParagraphStyle(
            'cover_detail',
            fontName='Helvetica',
            fontSize=11,
            textColor=colors.HexColor('#D1FAE5'),
            alignment=TA_CENTER,
            spaceAfter=3,
        ),
        'part': ParagraphStyle(
            'part',
            fontName='Helvetica-Bold',
            fontSize=20,
            textColor=BLANC,
            alignment=TA_CENTER,
            spaceAfter=0,
        ),
        'h1': ParagraphStyle(
            'h1',
            fontName='Helvetica-Bold',
            fontSize=15,
            textColor=VERT_F,
            spaceBefore=14,
            spaceAfter=6,
            borderPad=0,
        ),
        'h2': ParagraphStyle(
            'h2',
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=GRIS_T,
            spaceBefore=10,
            spaceAfter=4,
        ),
        'h3': ParagraphStyle(
            'h3',
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=VERT_M,
            spaceBefore=6,
            spaceAfter=3,
        ),
        'body': ParagraphStyle(
            'body',
            fontName='Helvetica',
            fontSize=10,
            textColor=GRIS_T,
            spaceAfter=5,
            alignment=TA_JUSTIFY,
            leading=15,
        ),
        'body_center': ParagraphStyle(
            'body_center',
            fontName='Helvetica',
            fontSize=10,
            textColor=GRIS_T,
            spaceAfter=5,
            alignment=TA_CENTER,
            leading=15,
        ),
        'bullet': ParagraphStyle(
            'bullet',
            fontName='Helvetica',
            fontSize=10,
            textColor=GRIS_T,
            spaceAfter=3,
            leftIndent=14,
            leading=14,
        ),
        'note': ParagraphStyle(
            'note',
            fontName='Helvetica-Oblique',
            fontSize=9,
            textColor=GRIS_SEC,
            spaceAfter=4,
            leftIndent=10,
            leading=13,
        ),
        'toc_h1': ParagraphStyle(
            'toc_h1',
            fontName='Helvetica-Bold',
            fontSize=11,
            textColor=GRIS_T,
            spaceAfter=4,
        ),
        'toc_h2': ParagraphStyle(
            'toc_h2',
            fontName='Helvetica',
            fontSize=10,
            textColor=GRIS_SEC,
            spaceAfter=3,
            leftIndent=14,
        ),
        'badge': ParagraphStyle(
            'badge',
            fontName='Helvetica-Bold',
            fontSize=9,
            textColor=VERT_F,
            alignment=TA_CENTER,
        ),
        'small': ParagraphStyle(
            'small',
            fontName='Helvetica',
            fontSize=9,
            textColor=GRIS_SEC,
            spaceAfter=3,
            leading=13,
        ),
    }
    return styles


# ── Composants réutilisables ───────────────────────────────────────────────────
def info_box(text, S, bg=BLEU_L, border=BLEU):
    """Encadré info avec fond coloré."""
    data = [[Paragraph(text, ParagraphStyle('ib', fontName='Helvetica', fontSize=10,
                                             textColor=GRIS_T, leading=14))]]
    t = Table(data, colWidths=[15.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('ROUNDEDCORNERS', [6]),
        ('BOX', (0,0), (-1,-1), 1, border),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    return t


def warn_box(text, S):
    return info_box(text, S, bg=ORNG_L, border=ORNG)


def role_table(S, rows):
    """Tableau rôles/permissions."""
    header = [
        Paragraph('Rôle', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9,
                                          textColor=BLANC, alignment=TA_CENTER)),
        Paragraph('Permissions', ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=9,
                                                 textColor=BLANC, alignment=TA_CENTER)),
    ]
    data = [header]
    for role, perms in rows:
        data.append([
            Paragraph(role, ParagraphStyle('tc', fontName='Helvetica-Bold', fontSize=9, textColor=GRIS_T)),
            Paragraph(perms, ParagraphStyle('tc', fontName='Helvetica', fontSize=9, textColor=GRIS_T, leading=13)),
        ])
    t = Table(data, colWidths=[5*cm, 10.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), VERT_F),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANC, VERT_L]),
        ('BOX', (0,0), (-1,-1), 0.5, BORD),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORD),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return t


def section_header(title, S):
    """En-tête de section coloré."""
    data = [[Paragraph(title, ParagraphStyle(
        'sh', fontName='Helvetica-Bold', fontSize=13,
        textColor=BLANC, leading=16))]]
    t = Table(data, colWidths=[15.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), VERT_F),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
    ]))
    return t


def steps_table(S, steps):
    """Tableau numéroté d'étapes."""
    data = []
    for i, (title, desc) in enumerate(steps, 1):
        num = Paragraph(str(i), ParagraphStyle(
            'sn', fontName='Helvetica-Bold', fontSize=13,
            textColor=BLANC, alignment=TA_CENTER))
        txt = Paragraph(f'<b>{title}</b><br/>{desc}',
                        ParagraphStyle('sd', fontName='Helvetica', fontSize=10,
                                       textColor=GRIS_T, leading=14))
        data.append([num, txt])
    t = Table(data, colWidths=[1.2*cm, 14.3*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), VERT_M),
        ('ROWBACKGROUNDS', (1,0), (1,-1), [BLANC, VERT_L]),
        ('BOX', (0,0), (-1,-1), 0.5, BORD),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORD),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return t


# ── Construction du document ───────────────────────────────────────────────────
def build_manual():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2.5*cm, bottomMargin=2*cm,
        title="Manuel d'Utilisation SIGADEC",
        author="Direction du Cadastre — DGI Côte d'Ivoire",
        subject="Documentation utilisateur de l'application SIGADEC",
    )

    S = make_styles()
    story = []

    # ══════════════════════════════════════════════════════════════════════════
    # PAGE DE COUVERTURE
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 0.5*cm))

    # Bloc vert principal
    cover_data = [[
        Paragraph("SIGADEC", S['cover_title']),
        Paragraph("Système Intégré de Gestion Administrative du Cadastre", S['cover_sub']),
        Spacer(1, 0.3*cm),
        Paragraph("Manuel d'Utilisation", ParagraphStyle(
            'cv2', fontName='Helvetica-Bold', fontSize=22,
            textColor=colors.HexColor('#A7F3D0'), alignment=TA_CENTER)),
        Spacer(1, 0.6*cm),
        Paragraph("Direction du Cadastre — DGI Côte d'Ivoire", S['cover_detail']),
        Paragraph("Version 1.0 — Mai 2026", S['cover_detail']),
    ]]
    cover_t = Table(cover_data, colWidths=[15.5*cm])
    cover_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), VERT_F),
        ('TOPPADDING', (0,0), (-1,-1), 30),
        ('BOTTOMPADDING', (0,0), (-1,-1), 30),
        ('LEFTPADDING', (0,0), (-1,-1), 20),
        ('RIGHTPADDING', (0,0), (-1,-1), 20),
        ('ROUNDEDCORNERS', [12]),
    ]))
    story.append(cover_t)
    story.append(Spacer(1, 1*cm))

    # Encadré description
    desc_data = [[
        Paragraph(
            "SIGADEC est l'application officielle de gestion administrative de la "
            "Direction du Cadastre. Elle permet de suivre les diligences, gérer "
            "les courriers, déposer des documents, planifier les activités et "
            "centraliser toutes les informations du service.",
            ParagraphStyle('cd', fontName='Helvetica', fontSize=11,
                           textColor=GRIS_T, alignment=TA_JUSTIFY, leading=16)),
    ]]
    desc_t = Table(desc_data, colWidths=[15.5*cm])
    desc_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), VERT_L),
        ('BOX', (0,0), (-1,-1), 2, VERT_M),
        ('TOPPADDING', (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('LEFTPADDING', (0,0), (-1,-1), 16),
        ('RIGHTPADDING', (0,0), (-1,-1), 16),
    ]))
    story.append(desc_t)
    story.append(Spacer(1, 1.5*cm))

    # Infos rapides
    quick_data = [
        [
            Paragraph("Plateforme", ParagraphStyle('ql', fontName='Helvetica-Bold', fontSize=9, textColor=GRIS_SEC, alignment=TA_CENTER)),
            Paragraph("Accès", ParagraphStyle('ql', fontName='Helvetica-Bold', fontSize=9, textColor=GRIS_SEC, alignment=TA_CENTER)),
            Paragraph("Support", ParagraphStyle('ql', fontName='Helvetica-Bold', fontSize=9, textColor=GRIS_SEC, alignment=TA_CENTER)),
        ],
        [
            Paragraph("Application Web (PWA)\nCompatible PC et mobile", ParagraphStyle('qv', fontName='Helvetica', fontSize=9, textColor=GRIS_T, alignment=TA_CENTER, leading=13)),
            Paragraph("https://da.gd/hvlutP", ParagraphStyle('qv', fontName='Helvetica', fontSize=9, textColor=BLEU, alignment=TA_CENTER, leading=13)),
            Paragraph("Administrateur SIGADEC\nDirection du Cadastre", ParagraphStyle('qv', fontName='Helvetica', fontSize=9, textColor=GRIS_T, alignment=TA_CENTER, leading=13)),
        ]
    ]
    quick_t = Table(quick_data, colWidths=[5.1*cm, 5.2*cm, 5.2*cm])
    quick_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), GRIS_B),
        ('BACKGROUND', (0,1), (-1,1), BLANC),
        ('BOX', (0,0), (-1,-1), 0.5, BORD),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORD),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(quick_t)

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # TABLE DES MATIÈRES
    # ══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph("Table des matières", S['h1']))
    story.append(ColorLine(VERT_F, thickness=2))
    story.append(Spacer(1, 10))

    toc = [
        ("1.", "Présentation de l'application", [
            ("1.1", "Qu'est-ce que SIGADEC ?"),
            ("1.2", "Les rôles utilisateurs"),
            ("1.3", "Les services et sous-directions"),
        ]),
        ("2.", "Premiers pas — Connexion et compte", [
            ("2.1", "Créer un compte"),
            ("2.2", "Se connecter"),
            ("2.3", "Modifier son profil"),
        ]),
        ("3.", "Tableau de bord", [
            ("3.1", "Vue d'ensemble"),
            ("3.2", "Rappels quotidiens"),
            ("3.3", "Planning charte et compte-rendu"),
        ]),
        ("4.", "Module Diligences", [
            ("4.1", "Liste des diligences"),
            ("4.2", "Créer une diligence"),
            ("4.3", "Suivre et mettre à jour"),
            ("4.4", "Détail d'une diligence"),
        ]),
        ("5.", "Module Informations", [
            ("5.1", "Consulter les informations"),
            ("5.2", "Créer une information"),
        ]),
        ("6.", "Module Documentation", [
            ("6.1", "Déposer un document"),
            ("6.2", "Consulter et ouvrir un document"),
            ("6.3", "Types de documents acceptés"),
        ]),
        ("7.", "Module Planning", [
            ("7.1", "Planning de la Charte d'Éthique"),
            ("7.2", "Planning des Comptes-Rendus"),
        ]),
        ("8.", "Module Courriers", [
            ("8.1", "Courriers reçus"),
            ("8.2", "Courriers émis"),
            ("8.3", "Détail d'un courrier"),
        ]),
        ("9.", "Module Émissions et Recettes", [
            ("9.1", "Enregistrer une émission"),
            ("9.2", "Enregistrer une recette"),
        ]),
        ("10.", "Notifications", []),
        ("11.", "Administration", [
            ("11.1", "Valider les comptes en attente"),
            ("11.2", "Gérer les comptes actifs"),
        ]),
        ("12.", "Mon Espace", []),
    ]

    for num, title, subs in toc:
        story.append(Paragraph(f"{num}  {title}", S['toc_h1']))
        for snum, stitle in subs:
            story.append(Paragraph(f"    {snum}  {stitle}", S['toc_h2']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 1 — PRÉSENTATION
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("1. Présentation de l'application", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph("1.1 Qu'est-ce que SIGADEC ?", S['h2']))
    story.append(Paragraph(
        "SIGADEC (Système Intégré de Gestion Administrative du Cadastre) est une "
        "application web progressive (PWA) conçue pour la Direction du Cadastre de "
        "la Direction Générale des Impôts de Côte d'Ivoire. Elle centralise et "
        "digitalise la gestion administrative quotidienne : suivi des diligences, "
        "gestion des courriers, dépôt de documents, planification des activités et "
        "coordination entre les différents services.",
        S['body']))
    story.append(Paragraph(
        "L'application est accessible depuis un navigateur web sur ordinateur ou "
        "smartphone, sans installation requise. Elle peut également être installée "
        "comme une application native sur l'écran d'accueil d'un appareil mobile.",
        S['body']))

    story.append(info_box(
        "<b>Adresse de l'application :</b> https://da.gd/hvlutP<br/>"
        "Navigateurs recommandés : Google Chrome, Microsoft Edge, Mozilla Firefox.",
        S, bg=BLEU_L, border=BLEU))
    story.append(Spacer(1, 8))

    story.append(Paragraph("1.2 Les rôles utilisateurs", S['h2']))
    story.append(Paragraph(
        "Chaque utilisateur dispose d'un rôle qui détermine ses accès et permissions :",
        S['body']))

    story.append(role_table(S, [
        ("Administrateur",
         "Accès complet à tous les modules. Gestion des comptes utilisateurs. "
         "Validation des inscriptions. Seul rôle à accéder au module Courriers."),
        ("Directeur du Cadastre",
         "Accès à tous les modules sauf Courriers. Peut soumettre des diligences. "
         "Accès à l'administration pour validation des comptes."),
        ("Conseiller Technique",
         "Accès aux Diligences, Informations, Documentation, Planning, "
         "Émissions/Recettes, Notifications."),
        ("Sous-Directeur",
         "Accès aux Diligences, Informations, Documentation, Planning, "
         "Émissions/Recettes, Notifications."),
        ("Chef de Service",
         "Accès aux Diligences, Informations, Documentation, Planning, "
         "Émissions/Recettes, Notifications."),
        ("Secrétariat",
         "Accès limité : Informations, Documentation, Notifications. "
         "Pas d'accès aux Diligences ni au Planning."),
    ]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("1.3 Les services et sous-directions", S['h2']))
    story.append(Paragraph(
        "L'application couvre 15 services répartis dans 5 sous-directions :",
        S['body']))

    sd_data = [
        [Paragraph("Sous-Direction", ParagraphStyle('th2', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC)),
         Paragraph("Services", ParagraphStyle('th2', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC))],
        ["Direction du Cadastre", "SPSE, SESC"],
        ["SD Assiette & Contrôle", "SCOAIF, SARIF, SRC"],
        ["SD Production foncière", "SCTF, SCAFR, SEP"],
        ["SD Information cadastrale", "SDIC, SSPDDA, SCR"],
        ["SD Évaluation & Expertise", "SEI, SEFR, SVCR"],
        ["Dir. des Systèmes d'Information", "SAFIC"],
    ]
    sd_rows = []
    for row in sd_data:
        if isinstance(row[0], str):
            sd_rows.append([
                Paragraph(row[0], ParagraphStyle('tc2', fontName='Helvetica', fontSize=9, textColor=GRIS_T)),
                Paragraph(row[1], ParagraphStyle('tc2', fontName='Helvetica-Bold', fontSize=9, textColor=VERT_F)),
            ])
        else:
            sd_rows.append(row)
    sd_t = Table([sd_data[0]] + sd_rows[1:], colWidths=[7.5*cm, 8*cm])
    sd_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), VERT_F),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANC, VERT_L]),
        ('BOX', (0,0), (-1,-1), 0.5, BORD),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORD),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sd_t)

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 2 — CONNEXION
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("2. Premiers pas — Connexion et compte", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph("2.1 Créer un compte", S['h2']))
    story.append(Paragraph(
        "Si vous n'avez pas encore de compte, vous devez en créer un. Votre compte "
        "sera ensuite soumis à validation par l'administrateur avant de pouvoir "
        "accéder à l'application.", S['body']))

    story.append(steps_table(S, [
        ("Accéder à l'application",
         "Ouvrez votre navigateur et rendez-vous sur l'adresse : "
         "https://da.gd/hvlutP"),
        ("Cliquer sur « Créer un compte »",
         "Sur l'écran de connexion, cliquez sur le lien de création de compte."),
        ("Remplir le formulaire",
         "Saisissez votre prénom, nom, adresse email professionnelle, "
         "sélectionnez votre rôle et votre service d'appartenance."),
        ("Définir un mot de passe",
         "Choisissez un mot de passe sécurisé d'au moins 8 caractères."),
        ("Attendre la validation",
         "Votre compte est créé avec le statut « En attente ». "
         "L'administrateur doit le valider avant que vous puissiez vous connecter."),
    ]))
    story.append(Spacer(1, 8))

    story.append(warn_box(
        "<b>Important :</b> Les rôles Administrateur et Directeur ne sont pas "
        "disponibles à l'auto-inscription. Ces comptes sont créés directement "
        "par l'administrateur système.", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph("2.2 Se connecter", S['h2']))
    story.append(steps_table(S, [
        ("Saisir votre email",
         "Sur l'écran d'accueil, entrez votre adresse email et cliquez sur « Continuer »."),
        ("Entrer votre mot de passe",
         "Saisissez votre mot de passe et cliquez sur « Se connecter »."),
        ("Première connexion",
         "Si c'est votre première connexion sur cette version de l'application, "
         "il vous sera demandé de créer ou de confirmer votre mot de passe."),
        ("Accès au tableau de bord",
         "Une fois authentifié, vous accédez directement au tableau de bord."),
    ]))
    story.append(Spacer(1, 6))

    story.append(info_box(
        "<b>Session persistante :</b> Votre session est conservée même si vous "
        "fermez le navigateur. Vous n'avez pas besoin de vous reconnecter à chaque visite. "
        "Pour vous déconnecter, utilisez le bouton « Déconnexion » dans le menu.", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph("2.3 Modifier son profil", S['h2']))
    story.append(Paragraph(
        "Accédez à votre profil via l'icône de profil dans la barre de navigation. "
        "Vous pouvez y consulter vos informations personnelles (nom, rôle, service) "
        "et modifier votre photo de profil.", S['body']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 3 — TABLEAU DE BORD
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("3. Tableau de bord", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Le tableau de bord est la page d'accueil de l'application. Il offre une "
        "vue synthétique de l'activité en cours.", S['body']))

    story.append(Paragraph("3.1 Vue d'ensemble", S['h2']))
    story.append(Paragraph(
        "Le tableau de bord affiche en temps réel :", S['body']))
    for item in [
        "Votre bannière personnalisée (nom, rôle, service)",
        "Les rappels quotidiens — diligences en retard ou proches de l'échéance",
        "Le nombre de diligences actives en cours",
        "Les courriers urgents en attente de réponse (+ de 10 jours)",
        "Les informations et actualités récentes",
        "L'état de la Charte d'Éthique du mois en cours",
        "L'état du Compte-Rendu de la semaine en cours",
        "Les statistiques globales : rapports, courriers, émissions, recettes",
    ]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))
    story.append(Spacer(1, 8))

    story.append(Paragraph("3.2 Rappels quotidiens", S['h2']))
    story.append(Paragraph(
        "Les rappels apparaissent automatiquement en haut du tableau de bord. "
        "Ils signalent les diligences dont l'échéance approche ou est dépassée. "
        "Un rappel en rouge indique une diligence en retard. Un rappel en orange "
        "signale une diligence dont l'échéance est dans les 3 prochains jours.",
        S['body']))
    story.append(Spacer(1, 6))

    story.append(Paragraph("3.3 Planning Charte et Compte-Rendu", S['h2']))
    story.append(Paragraph(
        "Le tableau de bord indique le service responsable de la Charte d'Éthique "
        "du mois et du Compte-Rendu de réunion de la semaine, ainsi que leur "
        "statut de soumission (soumis ou en attente). Un clic sur ces blocs "
        "permet de voir le détail ou d'ouvrir le document correspondant.", S['body']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 4 — DILIGENCES
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("4. Module Diligences", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Le module Diligences permet de créer, suivre et gérer toutes les tâches "
        "et missions assignées au sein de la Direction du Cadastre. "
        "Ce module n'est pas accessible aux utilisateurs ayant le rôle Secrétariat.",
        S['body']))

    story.append(Paragraph("4.1 Liste des diligences", S['h2']))
    story.append(Paragraph(
        "La liste affiche toutes les diligences avec leurs informations clés : "
        "référence, intitulé, statut, progression et échéance. "
        "Des filtres permettent d'affiner l'affichage :", S['body']))
    for item in [
        "Recherche textuelle (référence ou intitulé)",
        "Filtre par statut : Actives, En cours, Non Échu, Reportée, Exécutée, Supprimée, Toutes",
        "Filtre par fonction (Conseiller, Sous-Directeur, Chef de service)",
        "Filtre par année et mois",
    ]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))
    story.append(Spacer(1, 6))

    story.append(Paragraph("4.2 Créer une diligence", S['h2']))
    story.append(Paragraph(
        "Seuls les rôles Directeur, Conseiller Technique, Sous-Directeur et "
        "Administrateur peuvent créer des diligences.", S['note']))
    story.append(Spacer(1, 4))
    story.append(steps_table(S, [
        ("Cliquer sur « + Nouvelle »",
         "Le bouton se trouve en haut à droite de la liste des diligences."),
        ("Remplir l'intitulé et la description",
         "Saisissez l'objet de la diligence et une description détaillée."),
        ("Définir l'échéance",
         "Sélectionnez la date limite d'exécution."),
        ("Assigner la diligence",
         "Sélectionnez le(s) service(s) concerné(s) et la(les) personne(s) imputée(s)."),
        ("Joindre un document (optionnel)",
         "Vous pouvez attacher un fichier Word, Excel ou PDF à la diligence."),
        ("Enregistrer",
         "Cliquez sur « Enregistrer » pour créer la diligence. "
         "Une référence est automatiquement générée."),
    ]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("4.3 Suivre et mettre à jour", S['h2']))
    story.append(Paragraph(
        "Pour chaque diligence, les statuts possibles sont :", S['body']))

    status_data = [
        [Paragraph("Statut", ParagraphStyle('sh', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC)),
         Paragraph("Signification", ParagraphStyle('sh', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC))],
        ["En cours", "Diligence prise en charge, exécution en cours"],
        ["Non Échu", "Diligence assignée, délai non encore atteint"],
        ["Reportée", "Exécution reportée à une date ultérieure"],
        ["Exécutée", "Diligence terminée avec succès"],
        ["Supprimée", "Diligence annulée"],
    ]
    sdata = [[status_data[0][0], status_data[0][1]]]
    for row in status_data[1:]:
        sdata.append([
            Paragraph(row[0], ParagraphStyle('sv', fontName='Helvetica-Bold', fontSize=9, textColor=GRIS_T)),
            Paragraph(row[1], ParagraphStyle('sv', fontName='Helvetica', fontSize=9, textColor=GRIS_T)),
        ])
    st = Table(sdata, colWidths=[4*cm, 11.5*cm])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), VERT_F),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANC, VERT_L]),
        ('BOX', (0,0), (-1,-1), 0.5, BORD),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORD),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(st)
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "La barre de progression (0 à 100 %) permet d'indiquer le taux "
        "d'avancement. Elle est mise à jour manuellement dans le formulaire "
        "de modification de la diligence.", S['body']))

    story.append(Paragraph("4.4 Détail d'une diligence", S['h2']))
    story.append(Paragraph(
        "Cliquez sur une diligence pour accéder à sa page détaillée. "
        "Vous y trouverez :", S['body']))
    for item in [
        "Toutes les informations de la diligence",
        "L'historique complet des modifications avec dates et auteurs",
        "Les courriers liés à cette diligence",
        "Les boutons d'action : Modifier, Dupliquer, Changer le statut",
        "Le bouton Ouvrir pour consulter le fichier joint",
    ]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 5 — INFORMATIONS
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("5. Module Informations", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Le module Informations centralise les notes d'information, actualités et "
        "communications internes diffusées aux services de la Direction du Cadastre.",
        S['body']))

    story.append(Paragraph("5.1 Consulter les informations", S['h2']))
    story.append(Paragraph(
        "La liste des informations peut être filtrée par :", S['body']))
    for item in ["Recherche textuelle", "Statut (D'actualité, Urgent, Obsolète, Archivé)", "Année et mois"]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Les statuts des informations :", S['h3']))
    info_stat = [
        [Paragraph("Statut", ParagraphStyle('sh', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC)),
         Paragraph("Description", ParagraphStyle('sh', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC))],
        ["D'actualité", "Information active et pertinente"],
        ["Urgent", "Information nécessitant une attention immédiate"],
        ["Obsolète", "Information dépassée, conservée pour référence"],
        ["Archivé", "Information classée dans les archives"],
    ]
    ist_rows = [[info_stat[0][0], info_stat[0][1]]]
    for row in info_stat[1:]:
        ist_rows.append([
            Paragraph(row[0], ParagraphStyle('iv', fontName='Helvetica-Bold', fontSize=9, textColor=GRIS_T)),
            Paragraph(row[1], ParagraphStyle('iv', fontName='Helvetica', fontSize=9, textColor=GRIS_T)),
        ])
    ist = Table(ist_rows, colWidths=[4*cm, 11.5*cm])
    ist.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), VERT_F),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANC, VERT_L]),
        ('BOX', (0,0), (-1,-1), 0.5, BORD),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORD),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(ist)
    story.append(Spacer(1, 8))

    story.append(Paragraph("5.2 Créer une information", S['h2']))
    story.append(steps_table(S, [
        ("Cliquer sur « + Nouvelle »",
         "Le bouton se trouve en haut à droite de la liste."),
        ("Remplir le titre et la description",
         "Saisissez un titre clair et une description complète de l'information."),
        ("Choisir le statut",
         "Sélectionnez le statut approprié (D'actualité, Urgent, etc.)."),
        ("Sélectionner les services destinataires",
         "Choisissez les services auxquels l'information est destinée."),
        ("Lier à une diligence (optionnel)",
         "Vous pouvez associer l'information à une ou plusieurs diligences."),
        ("Joindre un fichier (optionnel)",
         "Attachez un document justificatif si nécessaire."),
    ]))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 6 — DOCUMENTATION
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("6. Module Documentation", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Le module Documentation est la bibliothèque numérique de la Direction "
        "du Cadastre. Il permet de déposer, consulter et ouvrir tous les documents "
        "officiels : rapports d'activités, comptes-rendus, notes de service, "
        "chartes d'éthique, rapports de mission, etc.", S['body']))

    story.append(Paragraph("6.1 Déposer un document", S['h2']))
    story.append(steps_table(S, [
        ("Cliquer sur « + Déposer »",
         "Le bouton se trouve en haut à droite de la liste des documents."),
        ("Saisir l'objet du document",
         "Entrez un titre descriptif pour le document."),
        ("Choisir le type de document",
         "Sélectionnez parmi les types disponibles : Rapport d'activités annuel, "
         "Rapport hebdomadaire, Compte-rendu de réunion, Note de service, "
         "Note d'information, Rapport de mission, Commentaire Charte d'Éthique, "
         "Rapport semestriel, Rapport trimestriel, Autre."),
        ("Renseigner les métadonnées",
         "Indiquez l'auteur (service), la sous-direction, le mois, "
         "l'année et, le cas échéant, le numéro de semaine."),
        ("Saisir un résumé (optionnel)",
         "Rédigez une brève description du contenu du document."),
        ("Attacher le fichier",
         "Glissez-déposez le fichier ou cliquez pour le sélectionner. "
         "Formats acceptés : PDF, Word (.docx/.doc), Excel (.xlsx/.xls)."),
        ("Cliquer sur « Déposer le document »",
         "La référence est générée automatiquement selon le type sélectionné."),
    ]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("6.2 Consulter et ouvrir un document", S['h2']))
    story.append(Paragraph(
        "Les documents peuvent être filtrés par type, auteur, sous-direction, "
        "année et mois. Pour chaque document, trois actions sont disponibles :",
        S['body']))

    actions_data = [
        [Paragraph("Action", ParagraphStyle('ah', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC)),
         Paragraph("Description", ParagraphStyle('ah', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC))],
        ["Afficher", "Ouvre une fenêtre avec toutes les métadonnées du document"],
        ["Modifier", "Permet de modifier les informations et de remplacer le fichier"],
        ["Ouvrir", "Télécharge et ouvre le fichier avec l'application appropriée sur votre appareil"],
    ]
    ad_rows = [[actions_data[0][0], actions_data[0][1]]]
    for row in actions_data[1:]:
        ad_rows.append([
            Paragraph(row[0], ParagraphStyle('av', fontName='Helvetica-Bold', fontSize=9, textColor=GRIS_T)),
            Paragraph(row[1], ParagraphStyle('av', fontName='Helvetica', fontSize=9, textColor=GRIS_T)),
        ])
    at = Table(ad_rows, colWidths=[3.5*cm, 12*cm])
    at.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), VERT_F),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANC, VERT_L]),
        ('BOX', (0,0), (-1,-1), 0.5, BORD),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORD),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(at)
    story.append(Spacer(1, 8))

    story.append(info_box(
        "<b>Bouton « Ouvrir » :</b> Le fichier s'ouvre automatiquement avec "
        "l'application installée sur votre appareil. Un fichier PDF s'ouvre avec "
        "Adobe Acrobat ou le lecteur PDF. Un fichier Word s'ouvre avec Microsoft Word "
        "ou WPS Office. Un fichier Excel s'ouvre avec Microsoft Excel ou WPS Office.", S))

    story.append(Paragraph("6.3 Types de documents acceptés", S['h2']))
    types_data = [
        [Paragraph("Type de fichier", ParagraphStyle('th3', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC)),
         Paragraph("Extensions", ParagraphStyle('th3', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC)),
         Paragraph("Application associée", ParagraphStyle('th3', fontName='Helvetica-Bold', fontSize=9, textColor=BLANC))],
        ["Document PDF", ".pdf", "Adobe Acrobat Reader, Lecteur PDF intégré"],
        ["Document Word", ".docx, .doc", "Microsoft Word, WPS Office"],
        ["Feuille de calcul", ".xlsx, .xls", "Microsoft Excel, WPS Office"],
        ["Présentation", ".pptx, .ppt", "Microsoft PowerPoint, WPS Office"],
        ["Image", ".jpg, .jpeg, .png", "Visionneuse d'images"],
    ]
    td_rows = [[types_data[0][0], types_data[0][1], types_data[0][2]]]
    for row in types_data[1:]:
        td_rows.append([
            Paragraph(row[0], ParagraphStyle('tv', fontName='Helvetica', fontSize=9, textColor=GRIS_T)),
            Paragraph(row[1], ParagraphStyle('tv', fontName='Helvetica-Bold', fontSize=9, textColor=VERT_F, fontName2='Courier')),
            Paragraph(row[2], ParagraphStyle('tv2', fontName='Helvetica', fontSize=9, textColor=GRIS_T)),
        ])
    td = Table(td_rows, colWidths=[4*cm, 3.5*cm, 8*cm])
    td.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), VERT_F),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [BLANC, VERT_L]),
        ('BOX', (0,0), (-1,-1), 0.5, BORD),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORD),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(td)

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 7 — PLANNING
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("7. Module Planning", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Le module Planning permet de visualiser et gérer le calendrier des "
        "deux activités récurrentes du Comité : la Charte d'Éthique mensuelle "
        "et les Comptes-Rendus de réunion hebdomadaires. "
        "Ce module n'est pas accessible au rôle Secrétariat.", S['body']))

    story.append(Paragraph("7.1 Planning de la Charte d'Éthique", S['h2']))
    story.append(Paragraph(
        "Le planning de la Charte d'Éthique indique, pour chaque mois de l'année, "
        "quel service est responsable de rédiger et soumettre le commentaire "
        "de la Charte d'Éthique. Pour chaque mois, les informations affichées sont :",
        S['body']))
    for item in [
        "Le service responsable et son chef",
        "Le statut de soumission (soumis / en attente)",
        "La date de soumission si le document a été remis",
        "Un bouton pour consulter le commentaire soumis",
    ]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))
    story.append(Spacer(1, 6))

    story.append(Paragraph("7.2 Planning des Comptes-Rendus", S['h2']))
    story.append(Paragraph(
        "Le planning des Comptes-Rendus présente la liste des 52 semaines de "
        "l'année avec, pour chaque semaine :", S['body']))
    for item in [
        "Le service désigné pour la prise en charge",
        "La date prévue de la réunion",
        "La date de lecture du CR",
        "Le statut (soumis / en attente)",
        "Un lien vers le document de CR correspondant",
    ]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 8 — COURRIERS
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("8. Module Courriers", S))
    story.append(Spacer(1, 8))

    story.append(warn_box(
        "<b>Accès restreint :</b> Le module Courriers est accessible uniquement "
        "aux utilisateurs ayant le rôle Administrateur.", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Le module Courriers centralise la gestion de toute la correspondance "
        "officielle de la Direction du Cadastre : courriers reçus (entrants) "
        "et courriers émis (sortants).", S['body']))

    story.append(Paragraph("8.1 Courriers reçus", S['h2']))
    story.append(Paragraph(
        "Les courriers reçus sont les correspondances adressées à la Direction. "
        "Ils passent par les statuts suivants :", S['body']))
    for item in [
        "En attente — Le courrier est enregistré et en attente de traitement",
        "Répondu — Une réponse a été transmise",
        "Archivé — Le courrier est classé sans suite active",
        "Sans suite — Le courrier ne nécessite pas de réponse",
    ]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))
    story.append(Spacer(1, 6))

    story.append(info_box(
        "<b>Alerte délai :</b> Tout courrier reçu sans réponse depuis plus de "
        "10 jours apparaît dans les courriers urgents du tableau de bord.", S,
        bg=URG_B, border=URG))
    story.append(Spacer(1, 8))

    story.append(Paragraph("8.2 Courriers émis", S['h2']))
    story.append(Paragraph(
        "Les courriers émis sont les correspondances produites par la Direction. "
        "Leur cycle de vie comprend les étapes suivantes :", S['body']))
    for item in [
        "En cours de rédaction — Le courrier est en préparation",
        "En attente de signature — Soumis pour validation et signature",
        "Signé et transmis — Le courrier a été signé et envoyé au destinataire",
        "Annulé — Le courrier a été annulé",
    ]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))
    story.append(Spacer(1, 8))

    story.append(Paragraph("8.3 Détail d'un courrier", S['h2']))
    story.append(Paragraph(
        "La page détail d'un courrier affiche l'ensemble des informations : "
        "référence, objet, date d'émission, partenaire, service émetteur, "
        "note interne, historique des relances et le fichier joint. "
        "Il est possible de modifier le statut, d'ajouter une note ou "
        "une relance, et de lier le courrier à une ou plusieurs diligences.",
        S['body']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 9 — ÉMISSIONS ET RECETTES
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("9. Module Émissions et Recettes", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Le module Émissions et Recettes permet d'enregistrer et de suivre "
        "les documents financiers de la Direction du Cadastre. "
        "L'accès est réservé aux utilisateurs autorisés (Directeur, "
        "Conseiller Technique, Sous-Directeur et Administrateur).", S['body']))

    story.append(Paragraph("9.1 Enregistrer une émission", S['h2']))
    story.append(Paragraph(
        "Une émission correspond à un document émis à caractère financier. "
        "Pour l'enregistrer :", S['body']))
    story.append(steps_table(S, [
        ("Aller dans l'onglet « Émissions »",
         "Dans le module Émissions/Recettes, sélectionnez l'onglet Émissions."),
        ("Cliquer sur « + Nouveau »",
         "Le formulaire d'enregistrement s'ouvre."),
        ("Remplir les champs",
         "Saisissez l'objet, la date et une description. "
         "Joignez le document justificatif si disponible."),
        ("Enregistrer",
         "Cliquez sur « Enregistrer ». Une référence est générée automatiquement."),
    ]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("9.2 Enregistrer une recette", S['h2']))
    story.append(Paragraph(
        "Le processus d'enregistrement d'une recette est identique à celui "
        "d'une émission. Sélectionnez simplement l'onglet « Recettes » "
        "avant de cliquer sur « + Nouveau ».", S['body']))

    story.append(info_box(
        "<b>Filtres disponibles :</b> Les émissions et recettes peuvent être "
        "filtrées par recherche textuelle, année et mois pour faciliter "
        "la consultation des archives.", S))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 10 — NOTIFICATIONS
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("10. Notifications", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Le module Notifications centralise toutes les alertes et rappels "
        "générés automatiquement par l'application.", S['body']))

    story.append(Paragraph("Types de notifications :", S['h3']))
    for item in [
        "Diligence en retard — Échéance dépassée",
        "Diligence proche de l'échéance — Dans les 3 prochains jours",
        "Rappels du planning — Charte ou CR non soumis",
    ]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "Le badge rouge sur l'icône de cloche dans la barre de navigation "
        "indique le nombre de notifications non lues. Cliquez sur une "
        "notification pour la marquer comme lue.", S['body']))

    story.append(info_box(
        "<b>Persistance :</b> Les notifications sont calculées au démarrage "
        "de l'application et mises à jour à chaque connexion.", S))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 11 — ADMINISTRATION
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("11. Administration", S))
    story.append(Spacer(1, 8))

    story.append(warn_box(
        "<b>Accès restreint :</b> Le module Administration est accessible "
        "uniquement aux utilisateurs ayant le rôle Administrateur ou Directeur.", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph("11.1 Valider les comptes en attente", S['h2']))
    story.append(Paragraph(
        "Lorsqu'un nouvel utilisateur s'inscrit, son compte est mis en attente "
        "de validation. L'administrateur reçoit une notification et doit traiter "
        "la demande :", S['body']))
    story.append(steps_table(S, [
        ("Accéder au module Administration",
         "Cliquez sur « Administration » dans le menu de navigation."),
        ("Vérifier l'onglet « En attente »",
         "Les comptes en attente de validation y sont listés avec leurs informations."),
        ("Valider ou rejeter",
         "Cliquez sur « Valider » pour activer le compte ou « Rejeter » pour le supprimer. "
         "Un compte validé peut immédiatement se connecter à l'application."),
    ]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("11.2 Gérer les comptes actifs", S['h2']))
    story.append(Paragraph(
        "Dans l'onglet « Actifs », vous trouverez la liste de tous les "
        "comptes utilisateurs actifs. Pour chaque compte, vous pouvez :",
        S['body']))
    for item in [
        "Suspendre le compte (passe en statut En attente, connexion bloquée)",
        "Supprimer définitivement le compte",
    ]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))

    story.append(warn_box(
        "<b>Attention :</b> La suppression d'un compte est irréversible. "
        "Privilégiez la suspension si vous souhaitez bloquer temporairement "
        "l'accès d'un utilisateur.", S))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # CHAPITRE 12 — MON ESPACE
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("12. Mon Espace", S))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Mon Espace est votre tableau de bord personnel. Il agrège, en un seul "
        "écran, toutes les informations qui vous concernent directement :",
        S['body']))
    for item in [
        "Vos diligences en cours et leur état d'avancement",
        "Les documents que vous avez soumis",
        "Les courriers qui vous sont assignés",
        "Vos informations personnelles et statistiques d'activité",
    ]:
        story.append(Paragraph(f"  •  {item}", S['bullet']))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # ANNEXES / FAQ
    # ══════════════════════════════════════════════════════════════════════════
    story.append(section_header("Annexe — Questions fréquentes (FAQ)", S))
    story.append(Spacer(1, 8))

    faq = [
        ("Je n'arrive pas à me connecter, que faire ?",
         "Vérifiez que votre email est correct et que votre compte a bien été "
         "validé par l'administrateur. Si c'est votre première connexion, "
         "l'application vous demandera de créer votre mot de passe. "
         "En cas de problème persistant, contactez l'administrateur SIGADEC."),
        ("Comment installer SIGADEC sur mon smartphone ?",
         "Ouvrez l'application dans Google Chrome (Android) ou Safari (iPhone). "
         "Une bannière apparaît pour proposer l'installation. Sinon, utilisez "
         "le menu du navigateur > « Ajouter à l'écran d'accueil »."),
        ("Le bouton « Ouvrir » ne fonctionne pas pour un document.",
         "Vérifiez que le fichier a bien été téléversé lors du dépôt. "
         "Si le bouton Ouvrir n'apparaît pas, c'est que le document n'a "
         "pas de fichier joint. Modifiez le document pour en attacher un."),
        ("Puis-je modifier une diligence après sa création ?",
         "Oui, sous réserve d'en avoir les droits (rôle approprié). "
         "Cliquez sur « Modifier » dans la liste ou sur la page détail "
         "de la diligence."),
        ("Comment signaler une diligence reportée ?",
         "Ouvrez la diligence concernée, cliquez sur « Modifier », "
         "changez le statut à « Reportée » et renseignez la nouvelle "
         "date d'échéance et les raisons du report."),
        ("Je ne vois pas certains modules dans le menu.",
         "L'affichage des modules dépend de votre rôle. Par exemple, "
         "le module Courriers est uniquement visible pour les Administrateurs. "
         "Le Planning et les Diligences ne sont pas accessibles au Secrétariat. "
         "Si vous pensez avoir besoin d'accès à un module, contactez l'administrateur."),
        ("Comment modifier mon mot de passe ?",
         "La gestion du mot de passe se fait lors de la connexion. "
         "Contactez l'administrateur si vous avez perdu votre mot de passe."),
        ("Mes données sont-elles sécurisées ?",
         "Oui. SIGADEC utilise Supabase comme base de données sécurisée avec "
         "authentification JWT et chiffrement des communications. "
         "Les fichiers sont stockés dans un espace privé et accessibles "
         "uniquement aux utilisateurs authentifiés via des liens temporaires."),
    ]

    for q, r in faq:
        # Question
        q_data = [[Paragraph(f"Q : {q}", ParagraphStyle(
            'fq', fontName='Helvetica-Bold', fontSize=10,
            textColor=VERT_F, leading=14))]]
        qt = Table(q_data, colWidths=[15.5*cm])
        qt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), VERT_L),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('BOX', (0,0), (-1,-1), 0.5, VERT_M),
        ]))
        story.append(qt)

        # Réponse
        r_data = [[Paragraph(f"R : {r}", ParagraphStyle(
            'fr', fontName='Helvetica', fontSize=10,
            textColor=GRIS_T, leading=14))]]
        rt = Table(r_data, colWidths=[15.5*cm])
        rt.setStyle(TableStyle([
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('BOX', (0,0), (-1,-1), 0.5, BORD),
        ]))
        story.append(rt)
        story.append(Spacer(1, 6))

    story.append(Spacer(1, 1*cm))

    # ── Pied de document ──
    footer_data = [[
        Paragraph(
            "SIGADEC — Système Intégré de Gestion Administrative du Cadastre\n"
            "Direction du Cadastre — Direction Générale des Impôts — Côte d'Ivoire\n"
            "Version 1.0 — Mai 2026",
            ParagraphStyle('fd', fontName='Helvetica', fontSize=9,
                           textColor=BLANC, alignment=TA_CENTER, leading=14))
    ]]
    ft = Table(footer_data, colWidths=[15.5*cm])
    ft.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), VERT_F),
        ('TOPPADDING', (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
    ]))
    story.append(ft)

    # ── Génération ────────────────────────────────────────────────────────────
    doc.build(
        story,
        onFirstPage=first_page,
        onLaterPages=add_page_number,
    )
    print(f"PDF généré : {OUTPUT_PATH}")
    print(f"Taille : {os.path.getsize(OUTPUT_PATH):,} octets")


if __name__ == '__main__':
    build_manual()
