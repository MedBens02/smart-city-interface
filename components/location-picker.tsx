"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Navigation, Search, Loader2 } from "lucide-react"

interface LocationData {
  address: string
  latitude: number | null
  longitude: number | null
}

interface LocationPickerProps {
  value: LocationData
  onChange: (location: LocationData) => void
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Check if script already exists
        const existingScript = document.querySelector(
          `script[src^="https://maps.googleapis.com/maps/api/js"]`
        )

        if (!existingScript) {
          // Load Google Maps script
          const script = document.createElement("script")
          script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
          script.async = true
          script.defer = true

          // Wait for script to load
          await new Promise<void>((resolve, reject) => {
            script.onload = () => {
              // Wait a bit more to ensure google.maps is fully initialized
              setTimeout(resolve, 100)
            }
            script.onerror = reject
            document.head.appendChild(script)
          })
        } else {
          // Script exists, wait for google.maps to be available
          await new Promise<void>((resolve) => {
            const checkGoogleMaps = () => {
              if (typeof google !== "undefined" && google.maps) {
                resolve()
              } else {
                setTimeout(checkGoogleMaps, 100)
              }
            }
            checkGoogleMaps()
          })
        }

        if (!mapRef.current) return

        // Default to Morocco center coordinates
        const defaultCenter = { lat: 33.9716, lng: -6.8498 }
        const center = value.latitude && value.longitude
          ? { lat: value.latitude, lng: value.longitude }
          : defaultCenter

        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom: value.latitude && value.longitude ? 15 : 6,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
        })

        setMap(mapInstance)

        // Create marker
        const markerInstance = new google.maps.Marker({
          map: mapInstance,
          position: center,
          draggable: true,
          title: "Sélectionnez l'emplacement",
        })

        setMarker(markerInstance)

        // Handle marker drag
        markerInstance.addListener("dragend", () => {
          const position = markerInstance.getPosition()
          if (position) {
            reverseGeocode(position.lat(), position.lng())
          }
        })

        // Handle map click
        mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            markerInstance.setPosition(e.latLng)
            reverseGeocode(e.latLng.lat(), e.latLng.lng())
          }
        })

        // Initialize Places Autocomplete
        if (searchInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: "ma" }, // Morocco
            fields: ["address_components", "geometry", "formatted_address"],
          })

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace()
            if (place.geometry?.location) {
              const lat = place.geometry.location.lat()
              const lng = place.geometry.location.lng()

              mapInstance.setCenter({ lat, lng })
              mapInstance.setZoom(15)
              markerInstance.setPosition({ lat, lng })

              onChange({
                address: place.formatted_address || "",
                latitude: lat,
                longitude: lng,
              })
            }
          })
        }

        setIsLoadingMap(false)
      } catch (error) {
        console.error("Error loading Google Maps:", error)
        setIsLoadingMap(false)
      }
    }

    initMap()
  }, [])

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder()
      const response = await geocoder.geocode({
        location: { lat, lng },
      })

      if (response.results[0]) {
        onChange({
          address: response.results[0].formatted_address,
          latitude: lat,
          longitude: lng,
        })
      }
    } catch (error) {
      console.error("Geocoding not available, using coordinates:", error)
      // Fallback: Use coordinates as address if geocoding is not enabled
      onChange({
        address: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
      })
    }
  }, [onChange])

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur")
      return
    }

    setIsLoadingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        if (map && marker) {
          map.setCenter({ lat, lng })
          map.setZoom(15)
          marker.setPosition({ lat, lng })
          reverseGeocode(lat, lng)
        }

        setIsLoadingLocation(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        alert("Impossible d'obtenir votre position. Veuillez vérifier vos paramètres de localisation.")
        setIsLoadingLocation(false)
      }
    )
  }, [map, marker, reverseGeocode])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Localisation
        </Label>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher une adresse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Current Location Button */}
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          className="w-full"
        >
          {isLoadingLocation ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Localisation en cours...
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-4 w-4" />
              Utiliser ma position actuelle
            </>
          )}
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative h-[400px] w-full overflow-hidden rounded-lg border border-border">
        {isLoadingMap && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />
      </div>

      {/* Selected Address Display */}
      {value.address && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-sm font-medium text-foreground">Adresse sélectionnée:</p>
          <p className="mt-1 text-sm text-muted-foreground">{value.address}</p>
          {value.latitude && value.longitude && (
            <p className="mt-1 text-xs text-muted-foreground">
              Coordonnées: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 Astuce: Cliquez sur la carte ou faites glisser le marqueur pour définir l'emplacement
      </p>
    </div>
  )
}
