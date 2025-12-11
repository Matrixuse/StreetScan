import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

export default function ReportDetail(){
  const { id } = useParams()
  const navigate = useNavigate()
  const reportId = Number(id)
  const [report, setReport] = React.useState(null)
  const [comments, setComments] = React.useState([])
  const [text, setText] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [hasUpvoted, setHasUpvoted] = React.useState(false)
  const currentUser = React.useMemo(()=>{ try { return JSON.parse(localStorage.getItem('currentUser')||'null') } catch { return null } },[])

  React.useEffect(()=>{
    const reports = JSON.parse(localStorage.getItem('reports')||'[]')
    const r = reports.find(x=>Number(x.id)===reportId)
    setReport(r||null)
    if(r){
      setStatus(r.status || (r.filled ? 'Repaired' : 'Pending'))
      const cu = JSON.parse(localStorage.getItem('currentUser')||'null')
      setHasUpvoted(Boolean(cu && Array.isArray(r.upvotes) && r.upvotes.includes(cu.email)))
    }
    const saved = JSON.parse(localStorage.getItem(`comments_${reportId}`)||'[]')
    setComments(saved)
  },[reportId])

  const updateStatus = (newStatus) => {
    if(!currentUser || !currentUser.isAdmin) return
    const all = JSON.parse(localStorage.getItem('reports')||'[]')
    const idx = all.findIndex(x=>Number(x.id)===reportId)
    if(idx===-1) return
    all[idx].status = newStatus
    // keep backward compat: remove filled flag if status is not Repaired
    if(newStatus !== 'Repaired' && all[idx].filled) delete all[idx].filled
    localStorage.setItem('reports', JSON.stringify(all))
    setReport(all[idx])
    setStatus(newStatus)
  }

  const toggleUpvote = () => {
    const cu = JSON.parse(localStorage.getItem('currentUser')||'null')
    if(!cu){
      navigate('/login')
      return
    }
    const all = JSON.parse(localStorage.getItem('reports')||'[]')
    const idx = all.findIndex(x=>Number(x.id)===reportId)
    if(idx===-1) return
    all[idx].upvotes = all[idx].upvotes || []
    const i = all[idx].upvotes.indexOf(cu.email)
    if(i === -1){
      all[idx].upvotes.push(cu.email)
      setHasUpvoted(true)
    } else {
      all[idx].upvotes.splice(i,1)
      setHasUpvoted(false)
    }
    localStorage.setItem('reports', JSON.stringify(all))
    setReport(all[idx])
  }

  const handleComment = (e)=>{
    e.preventDefault()
    if(!currentUser){
      navigate('/login')
      return
    }
    if(!text.trim()) return
    const c = { id: Date.now(), user: { name: currentUser.name, email: currentUser.email }, text: text.trim(), createdAt: new Date().toISOString() }
    const next = [c, ...comments]
    setComments(next)
    localStorage.setItem(`comments_${reportId}`, JSON.stringify(next))
    setText('')
  }

  if(report===null){
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-gray-800 p-6 rounded shadow text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Report not found</h3>
          <Link to="/gallery" className="inline-block px-4 py-2 bg-orange-600 text-white rounded">Back</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="mb-3">
        <Link to="/gallery" className="text-sm text-orange-400 underline">← Back to Gallery</Link>
      </div>
      <div className="bg-gray-800 rounded overflow-hidden shadow">
        <img src={report.image} alt="pothole" className="w-full h-96 object-cover" />
        <div className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-400">{report.user?.name || report.user?.email} • {new Date(report.createdAt).toLocaleString()}</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <button onClick={toggleUpvote} className={`px-2 py-1 rounded ${hasUpvoted ? 'bg-orange-600 text-white' : 'bg-gray-700 text-white'}`}>
                  ▲
                </button>
                <div className="text-gray-300">{(report.upvotes && report.upvotes.length) || 0}</div>
              </div>
              {currentUser?.isAdmin && (
                <select value={status} onChange={e=>updateStatus(e.target.value)} className="bg-gray-700 text-white px-2 py-1 rounded text-sm">
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Repaired">Repaired</option>
                </select>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-white">{report.address}</h2>
          <div className="text-gray-300 mt-1 mb-4">{report.landmark}</div>
          <p className="text-gray-200 mb-6">{report.description}</p>

          <hr className="border-gray-700 my-4" />

          <h3 className="text-xl text-white mb-3">Comments</h3>

          {currentUser ? (
            <form onSubmit={handleComment} className="mb-4">
              <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write a comment..." className="w-full p-3 rounded bg-gray-900 text-white mb-2" rows={3} />
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-orange-600 rounded text-white">Post Comment</button>
                <button type="button" onClick={()=>setText('')} className="px-4 py-2 border rounded text-white">Clear</button>
              </div>
            </form>
          ) : (
            <div className="mb-4 text-gray-300">Please <Link className="text-orange-400" to="/login">log in</Link> to post comments.</div>
          )}

          <div className="space-y-4">
            {comments.length===0 && <div className="text-gray-400">No comments yet.</div>}
            {comments.map(c=> (
              <div key={c.id} className="bg-gray-900 p-3 rounded">
                <div className="text-sm text-gray-400">{c.user?.name || c.user?.email} • {new Date(c.createdAt).toLocaleString()}</div>
                <div className="text-gray-200 mt-1">{c.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
