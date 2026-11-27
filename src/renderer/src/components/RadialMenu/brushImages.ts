export const brushUrls = Array.from(
  { length: 10 },
  (_, index) => `${import.meta.env.BASE_URL}images/brush${index + 1}.png`
)

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
