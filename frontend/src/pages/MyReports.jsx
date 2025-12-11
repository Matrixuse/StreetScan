import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function MyReports(){
  const [reports, setReports] = React.useState([])
  const currentUser = React.useMemo(()=>{ try { return JSON.parse(localStorage.getItem('currentUser')||'null') } catch { return null } },[])
  const navigate = useNavigate()

  const deleteReport = (id) => {
    if(!confirm('Delete this report?')) return
    const all = JSON.parse(localStorage.getItem('reports')||'[]')
    const remaining = all.filter(r=> r.id !== id)
    localStorage.setItem('reports', JSON.stringify(remaining))
    const mine = remaining.filter(r => r.user && r.user.email === currentUser.email)
    setReports(mine)
  }

  React.useEffect(()=>{
    if(currentUser){
      const all = JSON.parse(localStorage.getItem('reports')||'[]')
      const mine = all.filter(r => r.user && r.user.email === currentUser.email)
      setReports(mine)
    }
  },[currentUser])

  if(!currentUser){
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-gray-800 p-6 rounded shadow text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Please log in to view your reports</h3>
          <p className="text-sm text-gray-300 mb-4">Your personal uploads are private to your account.</p>
          <Link to="/login" className="inline-block px-4 py-2 bg-orange-600 text-white rounded">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={()=>navigate(-1)} className="text-sm text-orange-400 underline">← Back</button>
        <h2 className="text-2xl font-semibold text-white">My Reports</h2>
        <div />
      </div>
      {reports.length===0 ? (
        <div className="bg-gray-800 p-6 rounded text-gray-300">You haven't uploaded any reports yet. <Link to="/report" className="text-orange-400 underline">Report one now</Link>.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map(r=> (
            <Link key={r.id} to={`/report/${r.id}`} className="block bg-gray-800 rounded overflow-hidden shadow hover:shadow-2xl transition relative">
              {(() => {
                const statusLabel = r.status || (r.filled ? 'Repaired' : 'Pending')
                const statusClass = statusLabel === 'Verified' ? 'bg-blue-600' : statusLabel === 'Repaired' ? 'bg-green-600' : 'bg-yellow-600'
                return (
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded flex items-center gap-2 text-xs text-white ${statusClass}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {statusLabel}
                  </div>
                )
              })()}
              <img src={r.image} alt="pothole" className="w-full h-56 object-cover" />
              <div className="absolute top-3 right-3 flex items-center gap-2 text-xs text-gray-200">
                <div className="bg-gray-700 px-2 py-1 rounded flex items-center gap-1">
                  <span className="text-sm">▲</span>
                  <span>{(r.upvotes && r.upvotes.length) || 0}</span>
                </div>
                <button onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); deleteReport(r.id) }} className="ml-2 bg-red-700 px-2 py-1 rounded text-xs">Delete</button>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-400">{r.user?.name || r.user?.email} • {new Date(r.createdAt).toLocaleString()}</div>
                <div className="mt-2 text-white font-medium">{r.address}</div>
                <div className="text-gray-300 text-sm mt-1">{r.landmark}</div>
                <p className="mt-3 text-gray-200 text-sm">{r.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
