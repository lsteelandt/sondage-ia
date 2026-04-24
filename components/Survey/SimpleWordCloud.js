export default function SimpleWordCloud({ data, title, color, normalized }) {
  var entries = Object.entries(data)
  if (entries.length === 0) {
    return (
      <div className="border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <p className="text-white/40 text-sm">Aucun mot-clé collecté</p>
      </div>
    )
  }

  var maxCount = Math.max.apply(null, entries.map(function (e) {
    return normalized ? (e[1].occurrences || 1) : e[1]
  }))

  // Sort by count descending, then alphabetically for ties
  entries.sort(function (a, b) {
    var countA = normalized ? (a[1].occurrences || 1) : a[1]
    var countB = normalized ? (b[1].occurrences || 1) : b[1]
    if (countB !== countA) return countB - countA
    return a[0].localeCompare(b[0])
  })

  return (
    <div className="border border-white/20 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-3 items-center">
        {entries.map(function (entry, i) {
          var word = normalized ? entry[1].term : entry[0]
          var count = normalized ? (entry[1].occurrences || 1) : entry[1]
          var originals = normalized ? (entry[1].originals || []) : []
          var ratio = maxCount > 1 ? (count - 1) / (maxCount - 1) : 1
          var fontSize = Math.round(14 + ratio * 24)
          var wordColor = color || '#FFFFFF'
          var opacity = 0.7 + (ratio * 0.3)

          var tooltipId = 'tooltip-' + word.replace(/\s+/g, '-')

          return (
            <span key={word} className="relative group">
              <span
                style={{
                  fontSize: fontSize + 'px',
                  color: wordColor,
                  opacity: opacity,
                  lineHeight: 1.2
                }}
                className="font-medium cursor-default"
              >
                {word}
                <span className="text-xs opacity-50 ml-1">({count})</span>
              </span>

              {/* Tooltip */}
              {normalized && originals.length > 0 && (
                <div
                  id={tooltipId}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap"
                >
                  <div className="bg-gray-900 border border-white/20 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs">
                    <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1">Expressions originales</div>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {originals.map(function (orig, oi) {
                        return (
                          <span key={oi} className="bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                            {orig}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-white/20 rotate-45 -mt-1"></div>
                </div>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
