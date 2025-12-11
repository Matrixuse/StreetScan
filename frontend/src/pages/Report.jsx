import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Report(){
  const navigate = useNavigate()
  const currentUser = React.useMemo(()=>{
    try { return JSON.parse(localStorage.getItem('currentUser')||'null') } catch { return null }
  },[])
  const [file, setFile] = React.useState(null)
  const [preview, setPreview] = React.useState(null)
  const [error, setError] = React.useState('')
  const [description, setDescription] = React.useState('')
  // Prefill address from currentUser.location (if available) to avoid extra prompts
  const [address, setAddress] = React.useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('currentUser')||'null')
      if (u && u.location && typeof u.location.latitude === 'number' && typeof u.location.longitude === 'number') {
        return `${u.location.latitude.toFixed(5)}, ${u.location.longitude.toFixed(5)}`
      }
    } catch (e) {}
    return ''
  })
  const [landmark, setLandmark] = React.useState('')
  const [locError, setLocError] = React.useState('')
  const [isValidating, setIsValidating] = React.useState(false)
  const [inferenceResult, setInferenceResult] = React.useState(null)

  React.useEffect(()=>{
    if(file){
      const reader = new FileReader()
      reader.onload = ()=> setPreview(reader.result)
      reader.readAsDataURL(file)
    } else setPreview(null)
  },[file])

  const handleFileChange = (e) => {
    setError('')
    const f = e.target.files?.[0] || null
    if(!f){
      setFile(null)
      return
    }

    // Use file.lastModified to check the file's date
    const fileDate = new Date(f.lastModified)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)

    if (isNaN(fileDate.getTime())) {
      // If lastModified is not available, be conservative and allow the upload
      setFile(f)
      return
    }

    // Accept if file date is >= start of yesterday (i.e., yesterday or today)
    if (fileDate < startOfYesterday) {
      setFile(null)
      setError('Upload recent image')
      return
    }

    // file is recent enough
    setFile(f)
  }

  const handleSubmit = async (e)=>{
    e.preventDefault()
    const currentUser = JSON.parse(localStorage.getItem('currentUser')||'null')
    if(!currentUser){
      navigate('/login')
      return
    }
    if(!preview){
      alert('Please choose a photo')
      return
    }

    // Call the ML model to validate if the image is a pothole
    setIsValidating(true)
    setError('')
    setInferenceResult(null)

    try {
      // Convert data URL to blob and create FormData
      const response = await fetch(preview)
      const blob = await response.blob()
      const formData = new FormData()
      formData.append('image', blob, 'image.jpg')

      // Call the /api/infer endpoint to classify the image
      const inferenceResponse = await fetch('http://localhost:5000/api/infer', {
        method: 'POST',
        body: formData
      })

      const result = await inferenceResponse.json()
      setInferenceResult(result)

      if (!inferenceResponse.ok) {
        setError(`Model error: ${result.error || 'Unable to analyze image'}`)
        setIsValidating(false)
        return
      }

      // Check if image is a pothole (result.pothole_present)
      if (!result.pothole_present) {
        setError('Error:  Non-pothole image. Please upload an image of a pothole.')
        setIsValidating(false)
        return
      }

      // Image is a pothole - proceed with submission
      const reports = JSON.parse(localStorage.getItem('reports')||'[]')
      const newReport = {
        id: Date.now(),
        user: currentUser,
        image: preview,
        description,
        address,
        landmark,
        createdAt: new Date().toISOString(),
        status: 'Pending',
        upvotes: [],
        modelConfidence: {
          potholeConfidence: result.pothole_confidence,
          nonpotholeConfidence: result.nonpothole_confidence
        }
      }
      reports.unshift(newReport)
      localStorage.setItem('reports', JSON.stringify(reports))
      setIsValidating(false)
      navigate('/gallery')
    } catch (err) {
      console.error('Inference error:', err)
      setError(`Error analyzing image: ${err.message}. Make sure the backend server is running on http://localhost:5000`)
      setIsValidating(false)
    }
  }

  const useMyLocation = () => {
    setLocError('')
    if(!navigator.geolocation){
      setLocError('Geolocation not supported')
      return
    }
    navigator.geolocation.getCurrentPosition((pos)=>{
      const { latitude, longitude } = pos.coords
      setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
    }, (err)=>{
      setLocError('Unable to get location')
    }, { enableHighAccuracy: true, timeout: 10000 })
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <button onClick={()=>navigate(-1)} className="text-sm text-orange-400 underline">← Back</button>
        <h2 className="text-2xl font-semibold text-white">Report a Pothole</h2>
        <div />
      </div>
      {!currentUser && (
        <div className="mb-4 p-3 rounded bg-yellow-900 text-yellow-200">You must <a className="text-orange-400 underline" href="/login">log in</a> to upload reports.</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-1">
            <label className="block text-sm text-gray-300 mb-2">Photo</label>
            <input disabled={!currentUser} type="file" accept="image/*" onChange={handleFileChange} />
            {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
            <div className="mt-3 text-xs text-gray-400">Upload clear photo of the road/pothole.</div>
          </div>
          <div className="md:col-span-2">
            {preview ? (
              <img src={preview} alt="preview" className="w-full max-h-80 object-cover rounded mb-2" />
            ) : (
              <div className="w-full h-48 bg-gray-900 rounded flex items-center justify-center text-gray-500">No photo selected</div>
            )}
          </div>
        </div>

        <input className="w-full p-3 rounded bg-gray-900 text-white" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input className="w-full p-3 rounded bg-gray-900 text-white" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} />
            <button type="button" onClick={useMyLocation} className="absolute right-2 top-2 px-2 py-1 bg-gray-700 text-xs rounded">Use my location</button>
            {locError && <div className="text-xs text-red-400 mt-1">{locError}</div>}
          </div>
          <input className="w-full p-3 rounded bg-gray-900 text-white" placeholder="Nearby landmark" value={landmark} onChange={e=>setLandmark(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button disabled={!currentUser || !!error || !file || isValidating} className={`px-4 py-2 rounded text-white ${(!currentUser || !!error || !file || isValidating) ? 'bg-gray-700/60 cursor-not-allowed' : 'bg-orange-600'}`}>
            {isValidating ? 'Checking...' : 'Upload'}
          </button>
          <button type="button" onClick={()=>{setFile(null); setDescription(''); setAddress(''); setLandmark(''); setError(''); setInferenceResult(null)}} className="px-4 py-2 border rounded text-white">Reset</button>
        </div>
        {inferenceResult && (
          <div className={`mt-4 p-4 rounded ${inferenceResult.pothole_present ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
              <div className="font-semibold mb-2">Model Analysis Result:</div>
              <div>Pothole: {(inferenceResult.pothole_confidence * 100).toFixed(1)}%</div>
              <div>Non pothole: {(inferenceResult.nonpothole_confidence * 100).toFixed(1)}%</div>
              <div className="mt-2 font-semibold">
                {inferenceResult.pothole_present ? '✓ Image is a pothole' : '✗ Image is not a pothole'}
              </div>
              <div className="mt-2 text-sm">
                This is a govenment  website providing wrong information can cause penalties.
              </div>
            </div>
        )}
      </form>
    </div>
  )
}
