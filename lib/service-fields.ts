export interface ServiceField {
  name: string
  label: string
  type: "text" | "number" | "date" | "select" | "textarea" | "qr-scanner" | "time"
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validationRegex?: string
  conditionalDisplay?: {
    dependsOn: string
    showWhen: string | string[]
  }
}

export interface ServiceConfig {
  id: string
  name: string
  code: string
  extraFields: ServiceField[]
}

export const serviceConfigs: ServiceConfig[] = [
  {
    id: "smart-parking",
    name: "Smart Parking",
    code: "SPK",
    extraFields: [
      {
        name: "issueCategory",
        label: "Type de problème",
        type: "select",
        required: true,
        options: [
          { value: "payment_failure", label: "Paiement échoué" },
          { value: "sensor_error", label: "Erreur capteur" },
          { value: "illegal_parking", label: "Stationnement illégal" },
          { value: "app_issue", label: "Problème Application" },
        ],
      },
      {
        name: "spotNumber",
        label: "Numéro de la place",
        type: "text",
        placeholder: "Ex: P-1024",
        required: true,
        validationRegex: "^P-\\d{4}$",
      },
      {
        name: "licensePlate",
        label: "Matricule du véhicule",
        type: "text",
        placeholder: "Ex: 12345-A-44",
        required: true,
        validationRegex: "^\\d{1,5}-[A-Za-z\\u0600-\\u06FF]-\\d{1,2}$",
      },
      {
        name: "transactionId",
        label: "Référence de Transaction",
        type: "text",
        placeholder: "Référence de la transaction",
        required: false,
        validationRegex: "^[A-Za-z0-9-_]{5,30}$",
        conditionalDisplay: {
          dependsOn: "issueCategory",
          showWhen: "payment_failure",
        },
      },
    ],
  },
  {
    id: "incendies",
    name: "Incendies",
    code: "RFM",
    extraFields: [
      // Master field - always visible
      {
        name: "issueSubtype",
        label: "Type de signalement",
        type: "select",
        required: true,
        options: [
          { value: "manual_fire_report", label: "Signalement Incendie" },
          { value: "equipment_failure", label: "Panne Équipement" },
          { value: "evacuation_route_error", label: "Erreur Itinéraire" },
          { value: "missed_alert", label: "Alerte Non Reçue" },
          { value: "false_alert", label: "Fausse Alerte" },
          { value: "alert_out_of_zone", label: "Alerte Hors Zone" },
        ],
      },

      // Scenario A: manual_fire_report
      {
        name: "hazardType",
        label: "Type de feu",
        type: "select",
        required: true,
        options: [
          { value: "forest_fire", label: "Feu de forêt" },
          { value: "urban_fire", label: "Incendie urbain" },
          { value: "smoke", label: "Fumée" },
        ],
        conditionalDisplay: {
          dependsOn: "issueSubtype",
          showWhen: "manual_fire_report",
        },
      },

      // Scenario B: equipment_failure
      {
        name: "equipmentCondition",
        label: "État de l'équipement",
        type: "select",
        required: true,
        options: [
          { value: "broken", label: "Cassé" },
          { value: "stolen", label: "Volé" },
          { value: "offline", label: "Hors ligne" },
        ],
        conditionalDisplay: {
          dependsOn: "issueSubtype",
          showWhen: "equipment_failure",
        },
      },
      {
        name: "equipmentId",
        label: "Identifiant ID",
        type: "text",
        placeholder: "Identifiant de l'équipement",
        required: false,
        conditionalDisplay: {
          dependsOn: "issueSubtype",
          showWhen: "equipment_failure",
        },
      },

      // Scenario C: evacuation_route_error
      {
        name: "blockedRouteLocation",
        label: "Lieu du blocage",
        type: "text",
        placeholder: "Localisation précise du blocage",
        required: true,
        conditionalDisplay: {
          dependsOn: "issueSubtype",
          showWhen: "evacuation_route_error",
        },
      },
      {
        name: "obstacleType",
        label: "Type d'obstacle",
        type: "select",
        required: true,
        options: [
          { value: "fire", label: "Feu" },
          { value: "debris", label: "Débris" },
          { value: "locked_gate", label: "Portail verrouillé" },
          { value: "embouteillage", label: "Embouteillage" },
          { value: "other", label: "Autre" },
        ],
        conditionalDisplay: {
          dependsOn: "issueSubtype",
          showWhen: "evacuation_route_error",
        },
      },

      // Scenario D: Alert-related issues - All three types
      {
        name: "userLocationAtTime",
        label: "Votre position réelle",
        type: "text",
        placeholder: "Votre localisation lors de l'incident",
        required: false,
        conditionalDisplay: {
          dependsOn: "issueSubtype",
          showWhen: ["missed_alert", "false_alert", "alert_out_of_zone"],
        },
      },
      {
        name: "alertReferenceId",
        label: "ID Alerte",
        type: "text",
        placeholder: "Référence de l'alerte",
        required: false,
        conditionalDisplay: {
          dependsOn: "issueSubtype",
          showWhen: ["false_alert", "alert_out_of_zone"],
        },
      },
      {
        name: "distanceFromDanger",
        label: "Distance du danger",
        type: "text",
        placeholder: "Distance approximative",
        required: false,
        conditionalDisplay: {
          dependsOn: "issueSubtype",
          showWhen: "alert_out_of_zone",
        },
      },
    ],
  },
  {
    id: "touriste",
    name: "Touriste",
    code: "TRM",
    extraFields: [],
  },
  {
    id: "tri-dechets",
    name: "Tri des Déchets",
    code: "ENV",
    extraFields: [],
  },
  {
    id: "eau-potable",
    name: "Gestion de l'Eau Potable",
    code: "WM",
    extraFields: [],
  },
  {
    id: "patrimoine",
    name: "Service Gestion Patrimoine",
    code: "PAT",
    extraFields: [
      {
        name: "patrimoineType",
        label: "Type de patrimoine",
        type: "select",
        required: true,
        options: [
          { value: "monument", label: "Monument historique" },
          { value: "building", label: "Bâtiment classé" },
          { value: "site", label: "Site culturel" },
          { value: "other", label: "Autre" },
        ],
      },
      {
        name: "qrCode",
        label: "Scanner le code QR du patrimoine",
        type: "qr-scanner",
        placeholder: "Cliquez pour scanner",
        required: false,
      },
      {
        name: "observations",
        label: "Observations",
        type: "textarea",
        placeholder: "Détails supplémentaires...",
        required: false,
      },
    ],
  },
  {
    id: "proprete-urbaine",
    name: "Service Propreté Urbaine",
    code: "PRP",
    extraFields: [],
  },
  {
    id: "smart-traffic",
    name: "Smart Traffic",
    code: "STR",
    extraFields: [
      {
        name: "incidentType",
        label: "Type d'incident",
        type: "select",
        required: true,
        options: [
          { value: "traffic_lights_malfunction", label: "Dysfonctionnement Feux/Capteurs" },
          { value: "incorrect_information", label: "Information Erronée (App/Panneaux)" },
          { value: "unmanaged_congestion", label: "Congestion Non Gérée" },
        ],
      },
      {
        name: "incidentDate",
        label: "Date de l'incident",
        type: "date",
        required: true,
      },
      {
        name: "incidentTime",
        label: "Heure de l'incident",
        type: "time",
        required: true,
        conditionalDisplay: {
          dependsOn: "incidentType",
          showWhen: ["traffic_lights_malfunction", "unmanaged_congestion"],
        },
      },
      {
        name: "failureTypes",
        label: "Type de dysfonctionnement",
        type: "select",
        required: true,
        options: [
          { value: "FEUX_DEFECTUEUX", label: "Feux défectueux" },
          { value: "CYCLES_INADAPTES", label: "Cycles inadaptés" },
          { value: "CAPTEUR_HS", label: "Capteur hors service" },
          { value: "AUTRE", label: "Autre" },
        ],
        conditionalDisplay: {
          dependsOn: "incidentType",
          showWhen: "traffic_lights_malfunction",
        },
      },
      {
        name: "intersectionId",
        label: "Identifiant Intersection",
        type: "text",
        placeholder: "Ex: INT-001",
        required: false,
        conditionalDisplay: {
          dependsOn: "failureTypes",
          showWhen: ["FEUX_DEFECTUEUX", "CYCLES_INADAPTES"],
        },
      },
      {
        name: "failureTypes",
        label: "Type d'erreur",
        type: "select",
        required: true,
        options: [
          { value: "INFO_ERRONEE", label: "Information erronée" },
          { value: "ABSENCE_ALERTE", label: "Absence d'alerte" },
          { value: "PANNEAU_OBSOLETE", label: "Panneau obsolète" },
          { value: "AUTRE", label: "Autre" },
        ],
        conditionalDisplay: {
          dependsOn: "incidentType",
          showWhen: "incorrect_information",
        },
      },
      {
        name: "failureTypes",
        label: "Type de problème",
        type: "select",
        required: true,
        options: [
          { value: "CONGESTION_NON_DETECTEE", label: "Congestion non détectée" },
          { value: "NON_INTERVENTION", label: "Non intervention" },
          { value: "MAUVAISE_REGULATION", label: "Mauvaise régulation" },
          { value: "AUTRE", label: "Autre" },
        ],
        conditionalDisplay: {
          dependsOn: "incidentType",
          showWhen: "unmanaged_congestion",
        },
      },
      {
        name: "impacts",
        label: "Impact constaté",
        type: "select",
        required: true,
        options: [
          { value: "RETARD_MAJEUR", label: "Retard majeur" },
          { value: "RISQUE_ACCIDENT", label: "Risque d'accident" },
          { value: "EMBOUTEILLAGE", label: "Embouteillage" },
          { value: "AUTRE", label: "Autre" },
        ],
        conditionalDisplay: {
          dependsOn: "incidentType",
          showWhen: "traffic_lights_malfunction",
        },
      },
      {
        name: "impacts",
        label: "Impact constaté",
        type: "select",
        required: true,
        options: [
          { value: "PREJUDICE_ECONOMIQUE", label: "Préjudice économique" },
          { value: "RETARD", label: "Retard" },
          { value: "CONFUSION", label: "Confusion usagers" },
          { value: "AUTRE", label: "Autre" },
        ],
        conditionalDisplay: {
          dependsOn: "incidentType",
          showWhen: "incorrect_information",
        },
      },
      {
        name: "impacts",
        label: "Impact constaté",
        type: "select",
        required: true,
        options: [
          { value: "RISQUE_ACCIDENT", label: "Risque d'accident" },
          { value: "RETARD_MAJEUR", label: "Retard majeur" },
          { value: "POLLUTION", label: "Pollution atmosphérique" },
          { value: "AUTRE", label: "Autre" },
        ],
        conditionalDisplay: {
          dependsOn: "incidentType",
          showWhen: "unmanaged_congestion",
        },
      },
    ],
  },
  {
    id: "smart-utilities",
    name: "Smart Utilities",
    code: "WEM",
    extraFields: [
      {
        name: "issueType",
        label: "Type de problème",
        type: "select",
        required: true,
        options: [
          { value: "electricity_issue", label: "Problème Électrique (Smart Grid)" },
          { value: "water_issue", label: "Problème Eau (Fuite/Vanne)" },
          { value: "billing_dispute", label: "Contestation Facturation (Eau/Élec)" },
        ],
      },
      {
        name: "affectedServices",
        label: "Service affecté",
        type: "select",
        required: true,
        options: [
          { value: "ELECTRICITY", label: "Électricité" },
        ],
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "electricity_issue",
        },
      },
      {
        name: "affectedServices",
        label: "Service affecté",
        type: "select",
        required: true,
        options: [
          { value: "WATER", label: "Eau" },
        ],
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "water_issue",
        },
      },
      {
        name: "affectedServices",
        label: "Service affecté",
        type: "select",
        required: true,
        options: [
          { value: "WATER", label: "Eau" },
          { value: "ELECTRICITY", label: "Électricité" },
          { value: "BOTH", label: "Eau et Électricité" },
        ],
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "billing_dispute",
        },
      },
      {
        name: "meterIdElec",
        label: "Numéro de compteur électricité",
        type: "text",
        placeholder: "Ex: ELEC-12345",
        required: true,
        validationRegex: "^ELEC-\\d{5}$",
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "electricity_issue",
        },
      },
      {
        name: "electricityIssues",
        label: "Problème électrique",
        type: "select",
        required: true,
        options: [
          { value: "COUPURE_INTEMPESTIVE", label: "Coupure intempestive" },
          { value: "SMART_PLUG_DEFAILLANT", label: "Prise intelligente défaillante" },
          { value: "COMPTEUR_INTELLIGENT_HS", label: "Compteur intelligent HS" },
          { value: "SURTENSION", label: "Surtension" },
          { value: "AUTRE", label: "Autre" },
        ],
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "electricity_issue",
        },
      },
      {
        name: "meterIdWater",
        label: "Numéro de compteur eau",
        type: "text",
        placeholder: "Ex: EAU-67890",
        required: true,
        validationRegex: "^EAU-\\d{5}$",
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "water_issue",
        },
      },
      {
        name: "waterIssues",
        label: "Problème d'eau",
        type: "select",
        required: true,
        options: [
          { value: "ELECTROVANNE_FERMEE_ERREUR", label: "Électrovanne fermée par erreur" },
          { value: "FUITE_NON_DETECTEE", label: "Fuite non détectée" },
          { value: "PRESSION_ANORMALE", label: "Pression anormale" },
          { value: "COMPTEUR_BLOQUE", label: "Compteur bloqué" },
          { value: "AUTRE", label: "Autre" },
        ],
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "water_issue",
        },
      },
      {
        name: "periodStart",
        label: "Début de période",
        type: "date",
        required: true,
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "billing_dispute",
        },
      },
      {
        name: "periodEnd",
        label: "Fin de période",
        type: "date",
        required: true,
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "billing_dispute",
        },
      },
      {
        name: "contestedConsumptionWater",
        label: "Consommation eau contestée (m³)",
        type: "number",
        placeholder: "Ex: 12.5",
        required: false,
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "billing_dispute",
        },
      },
      {
        name: "contestedConsumptionElec",
        label: "Consommation électricité contestée (kWh)",
        type: "number",
        placeholder: "Ex: 150.0",
        required: false,
        conditionalDisplay: {
          dependsOn: "issueType",
          showWhen: "billing_dispute",
        },
      },
      {
        name: "requestedResolution",
        label: "Résolution demandée",
        type: "select",
        required: true,
        options: [
          { value: "REPARATION", label: "Réparation" },
          { value: "REMISE_EN_SERVICE", label: "Remise en service" },
          { value: "REVISION_FACTURE", label: "Révision facture" },
          { value: "INDEMNISATION", label: "Indemnisation" },
          { value: "AUTRE", label: "Autre" },
        ],
      },
    ],
  },
  {
    id: "gestion-dechets-gdd",
    name: "Gestion de Déchets",
    code: "GDD",
    extraFields: [],
  },
  {
    id: "mobilite-transport",
    name: "Mobilité & Transport Urbain (Bus)",
    code: "MTU",
    extraFields: [],
  },
  {
    id: "gestion-dechets-agd",
    name: "Gestion de Déchets Avancée",
    code: "AGD",
    extraFields: [],
  },
  {
    id: "eclairage-public",
    name: "Gestion d'Éclairage Public",
    code: "AEP",
    extraFields: [],
  },
]
