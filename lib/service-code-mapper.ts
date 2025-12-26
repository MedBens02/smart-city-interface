import { serviceConfigs } from "./service-fields"

/**
 * Converts a service ID to its corresponding service code
 * @param serviceId - The internal service ID (e.g., "smart-parking")
 * @returns The service code (e.g., "SPK")
 * @throws Error if service ID is not found
 */
export function getServiceCodeById(serviceId: string): string {
  const service = serviceConfigs.find((s) => s.id === serviceId)
  if (!service) {
    throw new Error(`Service not found for ID: ${serviceId}`)
  }
  return service.code
}

/**
 * Converts a service code to its corresponding service ID
 * @param code - The service code (e.g., "SPK")
 * @returns The internal service ID (e.g., "smart-parking") or undefined if not found
 */
export function getServiceIdByCode(code: string): string | undefined {
  return serviceConfigs.find((s) => s.code === code)?.id
}

/**
 * Gets the service name by its code
 * @param code - The service code (e.g., "SPK")
 * @returns The service name (e.g., "Smart Parking") or undefined if not found
 */
export function getServiceNameByCode(code: string): string | undefined {
  return serviceConfigs.find((s) => s.code === code)?.name
}
