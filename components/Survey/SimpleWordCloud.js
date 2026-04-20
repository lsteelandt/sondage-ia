export default function SimpleWordCloud({ data, title }) {
  var entries = Object.entries(data)
  if (entries.length === 0) {
    return (
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-3">{title}</h3>
        <p className="text-gray-400 text-sm">Aucun mot-clé</p>
      </div>
    )
  }

  var maxCount = Math.max.apply(null, entries.map(function (e) { return e[1] }))
  var palette = [
    '#4338ca', '#6366f1', '#7c3aed', '#8b5cf6',
    '#a78bfa', '#6d28d9', '#5b21b6', '#4f46e5',
    '#3b82f6', '#818cf8',
  ]

  // Sort by count descending, then alphabetically for ties
  entries.sort(function (a, b) {
    if (b[1] !== a[1]) return b[1] - a[1]
    return a[0].localeCompare(b[0])
  })

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2 items-center">
        {entries.map(function (entry, i) {
          var word = entry[0]
          var count = entry[1]
          var ratio = maxCount > 1 ? (count - 1) / (maxCount - 1) : 1
          var fontSize = Math.round(14 + ratio * 34)
          var color = palette[i % palette.length]
          return (
            <span
              key={word}
              style={{ fontSize: fontSize + 'px', color: color, lineHeight: 1.2 }}
              className="font-medium"
              title={count + ' occurrence' + (count > 1 ? 's' : '')}
            >
              {word}
            </span>
          )
        })}
      </div>
    </div>
  )
}
