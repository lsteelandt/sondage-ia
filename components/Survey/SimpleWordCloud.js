export default function SimpleWordCloud({ data, title, color }) {
  var entries = Object.entries(data)
  if (entries.length === 0) {
    return (
      <div className="glass p-6">
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

  var maxCount = Math.max.apply(null, entries.map(function (e) { return e[1] }))

  // Color palette for word cloud - bright colors on dark
  var palette = [
    '#FFFFFF', '#E0E7FF', '#C7D2FE', '#A5B4FC',
    '#818CF8', '#6366F1', '#4F46E5', '#4338CA',
  ]

  // Use provided color or default
  var baseColor = color || '#6366F1'

  // Sort by count descending, then alphabetically for ties
  entries.sort(function (a, b) {
    if (b[1] !== a[1]) return b[1] - a[1]
    return a[0].localeCompare(b[0])
  })

  return (
    <div className="glass p-6">
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
          var word = entry[0]
          var count = entry[1]
          var ratio = maxCount > 1 ? (count - 1) / (maxCount - 1) : 1
          var fontSize = Math.round(14 + ratio * 24)
          var wordColor = color || palette[i % palette.length]
          var opacity = 0.8 + (ratio * 0.2)
          return (
            <span
              key={word}
              style={{
                fontSize: fontSize + 'px',
                color: wordColor,
                opacity: opacity,
                lineHeight: 1.2
              }}
              className="font-medium hover:opacity-100 transition-opacity cursor-default"
              title={count + ' occurrence' + (count > 1 ? 's' : '')}
            >
              {word}
              <span className="text-xs opacity-60 ml-1">({count})</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
