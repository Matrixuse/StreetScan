import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup(){
  const navigate = useNavigate()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if(!name || !email || !password){
      setError('All fields required')
      return
    }
    const users = JSON.parse(localStorage.getItem('users')||'[]')
    if(users.find(u=>u.email===email)){
      setError('User already exists')
      return
    }
    users.push({ name, email, password })
    localStorage.setItem('users', JSON.stringify(users))
    // Do not auto-login after signup; redirect user to login page
    navigate('/login')
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-white mb-4">Sign up</h2>
      {error && <div className="mb-3 text-red-400">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-3 rounded bg-gray-900 text-white" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full p-3 rounded bg-gray-900 text-white" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full p-3 rounded bg-gray-900 text-white" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full py-2 bg-orange-600 rounded text-white font-medium">Create account</button>
      </form>
      <p className="mt-4 text-sm text-gray-300">Already have an account? <Link className="text-orange-400" to="/login">Login</Link></p>
      </div>
    </div>
  )
}
