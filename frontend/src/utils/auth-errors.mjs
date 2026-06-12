export function isAlreadyRegisteredError(value) {
  return value?.code === 409 || value?.response?.status === 409 || value?.response?.data?.code === 409
}
