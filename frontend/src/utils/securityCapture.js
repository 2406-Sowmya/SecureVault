export function getBrowserLocation(timeout = 8000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ location_permission: 'unsupported' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location_accuracy: position.coords.accuracy,
          location_permission: 'granted',
        })
      },
      (error) => {
        resolve({
          location_permission:
            error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable',
        })
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 0,
      },
    )
  })
}

export async function withBrowserLocation(payload) {
  const location = await getBrowserLocation()
  return { ...payload, ...location }
}
