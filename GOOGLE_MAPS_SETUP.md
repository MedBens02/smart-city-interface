# Google Maps API Setup Guide

## 🔑 Where to Put Your API Key

Your Google Maps API key should be placed in the `.env.local` file at the root of your project.

### Step 1: Open `.env.local`

The file is located at:
```
smart-city-interface/.env.local
```

### Step 2: Replace the Placeholder

Find this line in the file:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual Google Maps API key:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Restart Development Server

After adding your API key, restart the Next.js development server:
```bash
npm run dev
```

---

## 🗺️ Location Picker Features

The LocationPicker component in the claim form provides three ways to select a location:

### 1. **Search for a Place** 🔍
- Type an address or place name in the search box
- Autocomplete suggestions will appear as you type
- Click on a suggestion to select that location
- The map will zoom to the selected location
- The marker will be placed automatically

### 2. **Use Current Location** 📍
- Click the "Utiliser ma position actuelle" button
- Your browser will ask for location permission
- Once granted, the map will center on your current location
- The address will be automatically filled using reverse geocoding

### 3. **Click on the Map** 🖱️
- Click anywhere on the map to place the marker
- The marker can be dragged to adjust the position
- The address will be automatically determined from the coordinates
- Works for precise location selection

---

## 📊 Data Stored

When a location is selected, the following data is captured:

```typescript
{
  address: "123 Rue Mohammed V, Casablanca, Morocco",
  latitude: 33.5731,
  longitude: -7.5898
}
```

This data is then included in the claim submission JSON:

```json
{
  "claim": {
    "location": {
      "address": "123 Rue Mohammed V, Casablanca, Morocco",
      "latitude": 33.5731,
      "longitude": -7.5898
    }
  }
}
```

---

## 🔧 API Restrictions Configuration

Your API key has the following restrictions enabled (as mentioned):

✅ **Places API (New)** - For place search and autocomplete
✅ **Places API** - Legacy places support
✅ **Maps Embed API** - For embedded maps
✅ **Geolocation API** - For current location detection
✅ **Maps JavaScript API** - Core map rendering ⭐ **REQUIRED**
✅ **Navigation SDK** - For directions (future use)

These restrictions are perfect for the current implementation!

### Important Note:
The implementation uses the Google Maps JavaScript API directly (not the `@googlemaps/js-api-loader` package). The Maps JavaScript API is loaded dynamically via a script tag, which is the recommended approach for Next.js applications.

---

## 🌍 Default Map Settings

- **Default Center**: Morocco (33.9716, -6.8498)
- **Country Restriction**: Morocco (MA) for search autocomplete
- **Default Zoom**: 6 (country view) or 15 (when location is selected)
- **Map Type**: Roadmap with map type controls
- **Controls**: Map type control enabled, Street View disabled

---

## 🐛 Troubleshooting

### Map not loading?
1. Check that your API key is correctly set in `.env.local`
2. Ensure you've restarted the dev server after adding the key
3. Check browser console for any error messages
4. Verify your API key has the required APIs enabled in Google Cloud Console

### "This page can't load Google Maps correctly" error?
- Your API key might have billing disabled
- Enable billing in Google Cloud Console
- Or remove domain restrictions if testing locally

### Autocomplete not working?
- Ensure "Places API" and "Places API (New)" are both enabled
- Check API restrictions allow requests from your domain

### Current location not working?
- HTTPS is required for geolocation (localhost works over HTTP)
- User must grant browser location permission
- Check if Geolocation API is enabled on your key

---

## 📝 Usage Example

Here's how the LocationPicker is used in the claim form:

```tsx
<LocationPicker
  value={{
    address: commonData.location,
    latitude: commonData.latitude,
    longitude: commonData.longitude,
  }}
  onChange={(location) =>
    setCommonData((prev) => ({
      ...prev,
      location: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    }))
  }
/>
```

The component automatically handles:
- Map initialization
- Place search with autocomplete
- Current location detection
- Reverse geocoding (coordinates → address)
- Forward geocoding (address → coordinates)
- Map click and marker drag events

---

## 🎨 UI Features

- **Loading State**: Shows spinner while map loads
- **Address Display**: Shows selected address below map
- **Coordinates Display**: Shows lat/lng for verification
- **Helper Text**: Provides usage tips
- **Responsive**: Works on mobile and desktop
- **French Localization**: All text in French
