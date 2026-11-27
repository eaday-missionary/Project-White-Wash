export const brushUrls = Object.values(
  import.meta.glob('../../../images/brush*.png', {
    eager: true,
    query: '?url',
    import: 'default'
  })
) as string[]

let brushes: Promise<HTMLImageElement[]> | undefined

export function loadBrushes(): Promise<HTMLImageElement[]> {
  brushes ??= Promise.all(
    brushUrls.map(async (url) => {
      const image = new Image()
      image.src = url
      await image.decode()
      return image
    })
  )
  return brushes
}
