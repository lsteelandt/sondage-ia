/**
 * Pied de page légal — affiché en bas de toutes les pages de l'application.
 *
 * Texte normalisé d'information sur la localisation des données et le moteur
 * IA utilisé. À monter dans chaque page/layout public ou admin.
 *
 * Props:
 *  - centered: bool (défaut true) — centre le texte horizontalement
 *  - className: classes supplémentaires pour le conteneur externe
 */
export default function LegalFooter({ centered = true, className = '' }) {
  const alignment = centered ? 'text-center' : 'text-left'
  return (
    <p
      className={
        'text-white/40 text-xs max-w-2xl ' +
        (centered ? 'mx-auto' : '') +
        ' ' +
        className
      }
    >
      Vos réponses sont stockées en France et automatiquement supprimées au bout de 30 jours après votre dernier usage.
      L&apos;analyse IA repose sur la technologie française Mistral AI.
    </p>
  )
}
