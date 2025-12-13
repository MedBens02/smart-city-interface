# Smart City Interface

A modern French-language smart city portal built with Next.js 16, enabling citizens to submit and track service claims across various municipal services.

## Features

### Core Functionality
- **Multi-Service Claim System**: Support for 8 municipal services
  - Électricité (Electricity)
  - Smart Parking
  - Incendies (Fire Services)
  - Touriste (Tourist Services)
  - Tri des Déchets (Waste Sorting)
  - Gestion de l'Eau Potable (Water Management)
  - Service Gestion Patrimoine (Heritage Management)
  - Service Propreté Urbaine (Urban Cleanliness)

- **Dynamic Form System**: Service-specific fields with conditional logic
- **User Authentication**: Clerk-based authentication with SSO support
- **File Attachments**: Cloudflare R2 storage integration
- **Location Selection**: Interactive Google Maps integration
- **QR Code Scanning**: Camera and image-based QR code reader
- **Real-time Tracking**: Track claim status and communicate with service teams

### Technical Highlights
- **Next.js 16**: App Router, Server Components, TypeScript
- **Modern UI**: Radix UI components with Tailwind CSS
- **Form Validation**: Regex-based validation with real-time feedback
- **Responsive Design**: Mobile-first approach
- **API Integration**: Ready for Spring Boot backend

## Tech Stack

### Frontend
- **Framework**: Next.js 16.0.10
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation

### Authentication
- **Provider**: Clerk (@clerk/nextjs ^6.36.2)
- **Features**: SSO, custom routing, onboarding flow

### Maps & Location
- **API**: Google Maps JavaScript API
- **Features**:
  - Interactive map with markers
  - Place search and autocomplete
  - Geocoding and reverse geocoding
  - Current location detection
  - Country restriction (Morocco)

### QR Code Scanner
- **Camera Scanner**: @yudiel/react-qr-scanner
- **Image Processing**: jsQR
- **Modes**: Camera, Image Upload, Manual Entry

### File Storage
- **Provider**: Cloudflare R2
- **SDK**: AWS SDK v3 (S3-compatible)
- **Features**:
  - 5MB file size limit
  - Image-only validation
  - Automatic file naming with timestamps
  - Public URL generation

### Backend Integration
- **API Endpoint**: http://localhost:8080/api/claims
- **Format**: JSON payloads with structured data
- **Testing**: Automatic .txt file downloads for payload inspection

## Project Structure

```
smart-city-interface/
├── app/
│   ├── api/
│   │   └── upload/          # R2 file upload endpoint
│   └── ...                  # Next.js app routes
├── components/
│   ├── claim-form.tsx       # Main claim submission form
│   ├── dashboard.tsx        # Service selection dashboard
│   ├── location-picker.tsx  # Google Maps integration
│   ├── qr-scanner-field.tsx # QR code scanner component
│   └── ui/                  # Radix UI components
├── contexts/
│   ├── auth-context.tsx     # Clerk authentication
│   └── claims-context.tsx   # Local state management
├── lib/
│   ├── r2-upload.ts         # R2 upload utility
│   ├── upload-helpers.ts    # Client-side upload helpers
│   └── service-fields.ts    # Service configuration
└── ...
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Clerk account
- Google Cloud account (for Maps API)
- Cloudflare account (for R2 storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-city-interface
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Clerk Routing
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

   # Google Maps
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

   # Cloudflare R2
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=smartcity-attachments
   R2_PUBLIC_URL=https://pub-xyz.r2.dev
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration Guides

### Google Maps Setup
See [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) for detailed instructions on:
- Creating a Google Cloud project
- Enabling required APIs
- Generating API keys
- Setting up restrictions

### Cloudflare R2 Setup

1. **Create R2 bucket**
   - Go to Cloudflare Dashboard → R2
   - Create bucket: `smartcity-attachments`
   - Enable public access
   - Copy public URL

2. **Generate API credentials**
   - Navigate to R2 → Manage R2 API Tokens
   - Create API token with edit permissions
   - Copy Account ID, Access Key, and Secret Key

3. **Update .env.local**
   - Add all R2 credentials
   - Replace `R2_PUBLIC_URL` with actual public URL

## Service Configuration

### Adding a New Service

1. **Update Dashboard** ([components/dashboard.tsx](components/dashboard.tsx))
   ```typescript
   {
     id: "new-service",
     name: "New Service Name",
     description: "Service description",
     icon: IconComponent,
     url: "https://service.smartcity.gov",
     color: "bg-color-500/10 text-color-600",
   }
   ```

2. **Configure Service Fields** ([lib/service-fields.ts](lib/service-fields.ts))
   ```typescript
   {
     id: "new-service",
     name: "New Service Name",
     extraFields: [
       {
         name: "fieldName",
         label: "Field Label",
         type: "text",
         required: true,
       },
     ],
   }
   ```

3. **Add Conditional Logic** (if needed)
   ```typescript
   {
     name: "conditionalField",
     label: "Conditional Field",
     type: "select",
     required: true,
     conditionalDisplay: {
       dependsOn: "masterField",
       showWhen: "specific_value",
     },
   }
   ```

## Field Types

- **text**: Single-line text input
- **textarea**: Multi-line text input
- **number**: Numeric input
- **date**: Date picker
- **select**: Dropdown menu
- **qr-scanner**: QR code scanner (camera/upload/manual)

## Validation

### Regex Validation
Add `validationRegex` to any field:
```typescript
{
  name: "licensePlate",
  label: "License Plate",
  type: "text",
  validationRegex: "^\\d{1,5}-[A-Za-z\\u0600-\\u06FF]-\\d{1,2}$",
  placeholder: "12345-A-44",
}
```

### Conditional Display
Show fields based on other field values:
```typescript
{
  name: "transactionId",
  label: "Transaction ID",
  type: "text",
  conditionalDisplay: {
    dependsOn: "issueCategory",
    showWhen: "payment_failure",
  },
}
```

## API Integration

### Claim Submission Payload

```json
{
  "user": {
    "id": "clerk_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": null
  },
  "claim": {
    "serviceType": "electricite",
    "title": "Power outage",
    "description": "No electricity since morning",
    "priority": "high",
    "location": {
      "address": "123 Main St, Rabat",
      "latitude": 33.9716,
      "longitude": -6.8498
    },
    "attachments": [
      {
        "url": "https://pub-xyz.r2.dev/claims/1702456789-photo.jpg",
        "fileName": "photo.jpg",
        "fileType": "image/jpeg"
      }
    ],
    "extraData": {
      "accountNumber": "ELC-789012",
      "issueType": "outage"
    }
  }
}
```

### Backend Requirements

The backend should:
- Accept POST requests at `/api/claims`
- Parse JSON payload
- Generate `messageId`, `claimId`, `claimNumber`, `correlationId`, `timestamp`
- Return response with generated IDs
- Store claim in database

## Development

### Build for Production
```bash
npm run build
```

### Run Production Build
```bash
npm start
```

### Linting
```bash
npm run lint
```

## Testing Checklist

### Claim Submission
- [ ] Select each service type
- [ ] Fill required fields
- [ ] Test conditional field display
- [ ] Upload images (single and multiple)
- [ ] Select location on map
- [ ] Scan QR code (for patrimoine service)
- [ ] Verify JSON payload download
- [ ] Check R2 bucket for uploaded files

### Validation
- [ ] Submit with missing required fields
- [ ] Test regex validation (license plates, spot numbers)
- [ ] Test file size limits (max 5MB)
- [ ] Test file type restrictions (images only)

### UI/UX
- [ ] Test on mobile devices
- [ ] Verify responsive design
- [ ] Check dark mode (if applicable)
- [ ] Test keyboard navigation
- [ ] Verify loading states

## Known Limitations

- Phone number field not yet integrated (sends null)
- R2 upload falls back to blob URLs if upload fails
- API submission doesn't fail form if backend is down
- Limited to 5 image attachments per claim

## Future Enhancements

- [ ] Real-time claim status updates
- [ ] Push notifications for claim updates
- [ ] Chat functionality with service teams
- [ ] Claim history filtering and search
- [ ] Analytics dashboard for administrators
- [ ] Multi-language support (Arabic, English)
- [ ] Mobile app version
- [ ] Offline mode with sync

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

---

Built with ❤️ for Smart City Morocco
