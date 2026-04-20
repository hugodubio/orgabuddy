import { readFileSync, writeFileSync } from 'fs'
import { Resvg } from '@resvg/resvg-js'

const svg = readFileSync('./public/favicon.svg', 'utf8')

for (const size of [192, 512]) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const pngData = resvg.render()
  const png = pngData.asPng()
  writeFileSync(`./public/pwa-${size}.png`, png)
  console.log(`✓ pwa-${size}.png`)
}
