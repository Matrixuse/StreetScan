import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Admin credentials (hardcoded)
    const ADMIN_EMAIL = 'namans2k04@gmail.com'
    const ADMIN_PASSWORD = '87654321'

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = { email: ADMIN_EMAIL, name: 'Admin', isAdmin: true }
      localStorage.setItem('currentUser', JSON.stringify(adminUser))
      if (typeof onLogin === 'function') onLogin(adminUser)
      navigate('/')
      return
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const found = users.find(u => u.email === email && u.password === password)
    if (found) {
      const userObj = { email: found.email, name: found.name }
      localStorage.setItem('currentUser', JSON.stringify(userObj))
      // inform parent App about successful login so header updates immediately
      if (typeof onLogin === 'function') onLogin(userObj)

      // Request geolocation once after login to pre-fill report address (only if supported
      // and not already present). This triggers the browser permission prompt once.
      try {
        if (navigator && navigator.geolocation) {
          // Only prompt if we don't already have location saved for the user
          const existing = JSON.parse(localStorage.getItem('currentUser') || '{}') || {}
          if (!existing.location) {
            navigator.geolocation.getCurrentPosition((pos) => {
              try {
                const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
                const stored = JSON.parse(localStorage.getItem('currentUser') || '{}') || {}
                stored.location = loc
                localStorage.setItem('currentUser', JSON.stringify(stored))
                // inform parent of updated user object
                if (typeof onLogin === 'function') onLogin(stored)
              } catch (e) {
                // ignore storage errors
              }
            }, () => {
              // user denied or error — do nothing
            }, { enableHighAccuracy: true, timeout: 10000 })
          }
        }
      } catch (e) {
        // defensive: navigator may be unavailable in some test envs
      }
      navigate('/')
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-white mb-4">Login</h2>
      {error && <div className="mb-3 text-red-400">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-3 rounded bg-gray-900 text-white" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full p-3 rounded bg-gray-900 text-white" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full py-2 bg-orange-600 rounded text-white font-medium">Sign in</button>
      </form>
      <p className="mt-4 text-sm text-gray-300">Don't have an account? <Link className="text-orange-400" to="/signup">Sign up</Link></p>
      </div>
    </div>
  )
}
