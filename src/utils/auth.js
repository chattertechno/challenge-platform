export const isAuthenticated = () => {
  const token = localStorage.getItem('token')
  return !!token
}

export const logOut = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('code')
  localStorage.removeItem('identity')
}
