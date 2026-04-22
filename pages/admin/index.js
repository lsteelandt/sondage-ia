import { useState, useEffect } from 'react'
import Head from 'next/head'
import AuthForm from '../../components/Admin/AuthForm'

export default function AdminPage() {
  const [checking, setChecking] = useState(true)
  const [firstTime, setFirstTime] = useState(false)

  useEffect(function () {
    fetch('/api/admin/setup-check')
      .then(function (res) { return res.json() })
      .then(function (data) {
        setFirstTime(!data.setup)
        setChecking(false)
      })
      .catch(function () {
        setChecking(false)
      })
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 gradient-overlay pointer-events-none" />

        {/* Background */}
        <div className="absolute inset-0 bg-transilio-blue" />

        <Head>
          <title>Chargement... - Sondage IA Admin</title>
        </Head>

        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin">
          </div>
          <p className="text-white/50 text-sm">Vérification en cours...</p>
        </div>
      </div>
    )
  }

  return <AuthForm firstTime={firstTime} />
}
