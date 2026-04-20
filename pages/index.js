import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  const [code, setCode] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    var trimmed = code.trim()
    if (!trimmed) return
    router.push('/survey?session=' + trimmed)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sondage IA</h1>
          <p className="text-gray-500">Entrez le code fourni par votre formateur</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={function (e) { setCode(e.target.value) }}
            placeholder="Code de session"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Commencer
          </button>
        </form>
      </div>
    </div>
  )
}
