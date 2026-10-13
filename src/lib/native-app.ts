const nativeAppStorageKey = 'noteForestNativeMacApp'

export function isNativeMacApp() {
  const isNativeLaunch = new URLSearchParams(window.location.search).get('noteForestApp') === 'macos'
  if (isNativeLaunch) window.localStorage.setItem(nativeAppStorageKey, 'true')
  return isNativeLaunch || window.localStorage.getItem(nativeAppStorageKey) === 'true'
}
