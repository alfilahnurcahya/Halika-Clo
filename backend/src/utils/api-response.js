// Keep successful API responses consistent across routes.
export function successResponse(message, data = null) {
  return { success: true, message, data };
}
