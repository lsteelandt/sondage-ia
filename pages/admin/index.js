import { useState, useEffect } from 'react'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <AuthForm firstTime={firstTime} />
}
