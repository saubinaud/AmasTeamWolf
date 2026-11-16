/**
 * CSS para navegadores viejos (iPhone con iOS 15/16.0-16.1, Android con Chrome
 * o Samsung Internet desactualizados, navegadores de Huawei).
 *
 * Por qué existe: Tailwind 4 genera CSS para Safari 16.4+, Chrome 111+ y
 * Firefox 128+. Todo va dentro de `@layer` (Safari 15.4, Chrome 99, Samsung 18):
 * un navegador sin `@layer` descarta los bloques enteros y la web sale sin
 * diseño. Además los colores son `oklch()` (Chrome 111, Samsung 22) y los
 * degradados interpolan `in oklab` (Safari 16.2, Chrome 111): sin soporte el
 * degradado entero se cae.
 *
 * Qué hace: en el build, por cada hoja .css emite al lado una `*.legacy.css`
 * transformada y mete en el index.html un script de dos líneas que, solo si el
 * navegador no soporta lo que usa Tailwind 4, carga la legacy y apaga la
 * moderna. Los navegadores modernos reciben exactamente el mismo CSS de antes.
 *
 * Transformaciones de la hoja legacy (en este orden):
 *  1. `@layer` aplanado con @csstools/postcss-cascade-layers (mantiene el orden
 *     de la cascada subiendo la especificidad con `:not(#\#)`).
 *  2. Los valores por defecto de las variables `--tw-*` (que Tailwind pone solo
 *     para Safari/Firefox sin `@property`) se aplican siempre: Chrome < 85
 *     tampoco tiene `@property` y sin ellas se caen sombras, anillos y bordes.
 *  3. Degradados: `to right in oklab` pasa a `to right` (interpolación sRGB).
 *  4. `translate:`/`rotate:` sueltos (Chrome 104, Samsung 20, Safari 14.1) tienen
 *     un `transform:` equivalente dentro de `@supports not (translate:0)`, para
 *     que no se descentren modales e insignias con `-translate-x-1/2`.
 *  5. `dvh`/`svh`/`lvh` (Safari 15.4, Chrome 108) llevan antes la misma
 *     declaración en `vh`.
 *  6. Atajos lógicos con var() (`px-*`, `py-*`, `inset-0`: Chrome 87, Safari
 *     14.1) llevan antes sus propiedades físicas (left/right, top/bottom).
 *  7. Lightning CSS con los navegadores objetivo: `oklch()` a hex con
 *     `@supports` para pantallas P3, prefijos `-webkit-`, etc.
 */
import type { Plugin } from 'vite'
import postcss, { type AtRule, type Declaration, type Rule } from 'postcss'
import cascadeLayers from '@csstools/postcss-cascade-layers'
import browserslist from 'browserslist'
import { browserslistToTargets, transform } from 'lightningcss'

/** Navegadores a los que tiene que llegar la hoja legacy. */
export const NAVEGADORES_LEGADO =
  'Chrome >= 80, Edge >= 88, Firefox >= 78, Safari >= 14, iOS >= 14, Samsung >= 12'

/**
 * Lo que necesita la hoja moderna de Tailwind 4. Si falta algo, se usa la
 * legacy. `CSSLayerBlockRule` existe desde Safari 15.4 / Chrome 99.
 */
const DETECTOR = `!function(){try{var c=window.CSS;if(window.CSSLayerBlockRule&&c&&c.supports&&c.supports("color","oklch(0% 0 0)")&&c.supports("background-image","linear-gradient(in oklab,red,red)"))return;document.documentElement.setAttribute("data-css","legacy");var l=document.querySelectorAll('link[rel="stylesheet"][data-legacy]');for(var i=0;i<l.length;i++){document.write('<link rel="stylesheet" href="'+l[i].getAttribute("data-legacy")+'">');l[i].media="not all"}}catch(e){}}()`

/** Atajo lógico -> propiedades físicas (la web es LTR). */
const LOGICAS: Record<string, string[]> = {
  inset: ['top', 'right', 'bottom', 'left'],
  'inset-inline': ['left', 'right'],
  'inset-block': ['top', 'bottom'],
  'padding-inline': ['padding-left', 'padding-right'],
  'padding-block': ['padding-top', 'padding-bottom'],
  'margin-inline': ['margin-left', 'margin-right'],
  'margin-block': ['margin-top', 'margin-bottom'],
}

/** Separa un valor CSS por espacios de primer nivel (respeta calc()/var()). */
function partirValor(valor: string): string[] {
  const partes: string[] = []
  let prof = 0
  let actual = ''
  for (const ch of valor.trim()) {
    if (ch === '(') prof++
    if (ch === ')') prof--
    if (/\s/.test(ch) && prof === 0) {
      if (actual) partes.push(actual)
      actual = ''
    } else actual += ch
  }
  if (actual) partes.push(actual)
  return partes
}

const VALORES_TW =/\(-webkit-hyphens:\s*none\)|\(-moz-orient:\s*inline\)/

function plugCompat(): postcss.Plugin {
  return {
    postcssPlugin: 'compat-legado',
    OnceExit(root) {
      // 2. Valores por defecto de --tw-* siempre.
      root.walkAtRules('supports', (at: AtRule) => {
        if (VALORES_TW.test(at.params)) at.replaceWith(at.nodes ?? [])
      })

      root.walkDecls((d: Declaration) => {
        // 3. Degradados sin espacio de color.
        if (d.prop === '--tw-gradient-position') {
          d.value = d.value.replace(/\s+in\s+ok(lab|lch)\b/g, '').trim() || 'initial'
        }
        // 6. Respaldo físico para los atajos lógicos con var() (px-*, py-*,
        //    inset-0...), que Lightning CSS no baja: Chrome 87, Safari 14.1.
        const fisicas = LOGICAS[d.prop]
        if (fisicas) {
          const v = partirValor(d.value)
          // inset con un valor; los atajos de dos lados con uno o dos (inicio fin).
          const maximo = d.prop === 'inset' ? 1 : 2
          if (v.length >= 1 && v.length <= maximo) {
            fisicas.forEach((prop, i) => d.cloneBefore({ prop, value: v[Math.min(i, v.length - 1)] }))
          }
        }
        // 5. Respaldo vh para dvh/svh/lvh.
        if (/\d(dvh|svh|lvh)\b/.test(d.value) && !d.prop.startsWith('--')) {
          d.cloneBefore({ value: d.value.replace(/(\d)(dvh|svh|lvh)\b/g, '$1vh') })
        }
      })

      // 4. transform equivalente para translate/rotate sueltos.
      const transformLegado =
        'translate(var(--tw-translate-x,0),var(--tw-translate-y,0)) rotate(var(--tw-rotate-legado,0deg))'
      root.walkRules((rule: Rule) => {
        if (rule.parent?.type === 'atrule' && /keyframes/.test((rule.parent as AtRule).name)) return
        const extra: postcss.ChildProps[] = []
        rule.each((n) => {
          if (n.type !== 'decl') return
          if (n.prop === 'translate' && /var\(--tw-translate-x\)/.test(n.value)) {
            extra.push({ prop: 'transform', value: transformLegado })
          } else if (n.prop === 'rotate' && /^-?[\d.]+(deg|turn|rad)$/.test(n.value)) {
            extra.push({ prop: '--tw-rotate-legado', value: n.value }, { prop: 'transform', value: transformLegado })
          }
        })
        if (!extra.length) return
        const copia = rule.clone({ nodes: [] })
        copia.append(...extra)
        rule.after(postcss.atRule({ name: 'supports', params: 'not (translate:0)' }).append(copia))
      })
    },
  }
}

export async function cssLegado(css: string, archivo: string): Promise<string> {
  const plano = await postcss([cascadeLayers(), plugCompat()]).process(css, { from: archivo })
  const { code } = transform({
    filename: archivo,
    code: Buffer.from(plano.css),
    minify: true,
    targets: browserslistToTargets(browserslist(NAVEGADORES_LEGADO)),
  })
  return code.toString()
}

export default function cssLegadoPlugin(): Plugin {
  const legacy = new Map<string, string>() // hoja moderna -> hoja legacy
  return {
    name: 'css-legado',
    apply: 'build',
    async generateBundle(_opts, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset' || !asset.fileName.endsWith('.css')) continue
        const fuente = typeof asset.source === 'string' ? asset.source : Buffer.from(asset.source).toString()
        const fileName = asset.fileName.replace(/\.css$/, '.legacy.css')
        this.emitFile({ type: 'asset', fileName, source: await cssLegado(fuente, asset.fileName) })
        legacy.set(asset.fileName, fileName)
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html
        // Las hojas que se cargan después por import() no pasan por aquí.
        const enHtml = new Set<string>()
        let salida = html.replace(/<link rel="stylesheet"([^>]*?) href="\/([^"]+\.css)">/g, (tag, attrs, href) => {
          const css = Object.values(ctx.bundle!).find((a) => a.type === 'asset' && a.fileName === href)
          if (!css) return tag
          enHtml.add(href)
          const leg = href.replace(/\.css$/, '.legacy.css')
          return `<link rel="stylesheet"${attrs} href="/${href}" data-legacy="/${leg}">`
        })
        for (const a of Object.values(ctx.bundle)) {
          if (a.type === 'asset' && a.fileName.endsWith('.css') && !a.fileName.endsWith('.legacy.css') && !enHtml.has(a.fileName)) {
            console.warn(`css-legado: ${a.fileName} no está en index.html; no tendrá versión legacy en navegadores viejos`)
          }
        }
        salida = salida.replace(/(<link rel="stylesheet"[^>]*data-legacy[^>]*>)(?![\s\S]*data-legacy)/, `$1\n  <script>${DETECTOR}</script>`)
        return salida
      },
    },
  }
}
