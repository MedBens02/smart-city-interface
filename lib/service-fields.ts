export interface ServiceField {
  name: string
  label: string
  type: "text" | "number" | "date" | "select" | "textarea" | "qr-scanner"
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
  extraFields: ServiceField[]
}

export const serviceConfigs: ServiceConfig[] = [
  {
    id: "electricite",
    name: "Électricité",
    extraFields: [
      {
        name: "accountNumber",
        label: "Numéro de compte électricité",
        type: "text",
        placeholder: "ex: ELC-789012",
        required: true,
      },
      {
        name: "outageDate",
        label: "Date de la panne (si applicable)",
        type: "date",
        required: false,
      },
      {
        name: "issueType",
        label: "Type de problème",
        type: "select",
        required: true,
        options: [
          { value: "outage", label: "Panne de courant" },
          { value: "voltage", label: "Fluctuation de tension" },
          { value: "billing", label: "Problème de facturation" },
          { value: "meter", label: "Problème de compteur" },
          { value: "connection", label: "Nouvelle connexion" },
          { value: "other", label: "Autre" },
        ],
      },
      {
        name: "affectedAppliances",
        label: "Appareils affectés (si applicable)",
        type: "textarea",
        placeholder: "Liste des appareils endommagés...",
        required: false,
      },
    ],
  },
  {
    id: "smart-parking",
    name: "Smart Parking",
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
    extraFields: [],
  },
  {
    id: "tri-dechets",
    name: "Tri des Déchets",
    extraFields: [],
  },
  {
    id: "eau-potable",
    name: "Gestion de l'Eau Potable",
    extraFields: [],
  },
  {
    id: "patrimoine",
    name: "Service Gestion Patrimoine",
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
    extraFields: [],
  },
]
