import '../styles/globals.css'
import Tracker from '../components/Analytics/Tracker'

function MyApp({ Component, pageProps }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Component {...pageProps} />
      <Tracker />
    </div>
  )
}

export default MyApp
