// The list API blanks unverified camera sources; signing URLs happens on selection.
export function hasBothRecordings(videos) {
  const hasSource = source => typeof source === 'string'
    ? Boolean(source.trim())
    : Boolean(source && typeof source.url === 'string' && source.url.trim())
  return ['a', 'b'].every(side => Object.values(videos?.[side] || {}).some(hasSource))
}
