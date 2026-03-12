/**
 * CopyMD — Embeddable "Copy as Markdown" widget
 * Add to any page: <script src="https://zcag.github.io/copymd/copymd.js" defer></script>
 *
 * Options (via data attributes on the script tag):
 *   data-position="bottom-right" (bottom-right | bottom-left | top-right | top-left)
 *   data-theme="dark" (dark | light)
 *   data-label="Copy as MD" (custom button label)
 *   data-branding="true" (show "Powered by CopyMD" — free tier)
 */
;(function () {
  'use strict'

  // ─── Config from script tag ───

  const scriptTag = document.currentScript
  const cfg = {
    position: (scriptTag && scriptTag.dataset.position) || 'bottom-right',
    theme: (scriptTag && scriptTag.dataset.theme) || 'dark',
    label: (scriptTag && scriptTag.dataset.label) || 'Copy as MD',
    branding: (scriptTag && scriptTag.dataset.branding) !== 'false',
  }

  // ─── Readability: extract main content ───

  const REMOVE_TAGS = new Set([
    'script','style','noscript','iframe','svg','canvas',
    'nav','footer','header','aside','form','button',
    'input','select','textarea','label',
  ])

  const SKIP_CLASSES = /nav|menu|sidebar|footer|header|breadcrumb|pagination|ads?|banner|cookie|popup|modal|overlay|social|share|comment-form|search-form/i

  function findMainContent() {
    const article = document.querySelector('article')
    if (article && article.textContent.trim().length > 200) return article
    const main = document.querySelector('main')
    if (main && main.textContent.trim().length > 200) return main
    const role = document.querySelector('[role="main"]')
    if (role && role.textContent.trim().length > 200) return role

    let best = null, bestScore = 0
    for (const el of document.querySelectorAll('div, section')) {
      const paragraphs = el.querySelectorAll('p')
      let textLen = 0
      for (const p of paragraphs) textLen += p.textContent.trim().length
      const linkDensity = (el.querySelectorAll('a').length + 1) / (paragraphs.length + 1)
      const score = textLen / (linkDensity + 1)
      if (score > bestScore) { bestScore = score; best = el }
    }
    return best || document.body
  }

  // ─── HTML → Markdown converter ───

  function nodeToMd(node, opts) {
    if (!opts) opts = {}
    if (node.nodeType === 3) {
      let t = node.textContent
      if (!opts.pre) t = t.replace(/\s+/g, ' ')
      return t
    }
    if (node.nodeType !== 1) return ''

    const tag = node.tagName.toLowerCase()
    if (REMOVE_TAGS.has(tag)) return ''
    if (node.hidden || node.getAttribute('aria-hidden') === 'true') return ''
    if (node.id === 'copymd-widget' || node.id === 'copymd-toast') return ''
    try {
      const s = window.getComputedStyle(node)
      if (s.display === 'none' || s.visibility === 'hidden') return ''
    } catch (_) {}
    if (SKIP_CLASSES.test(node.className)) return ''

    const ch = () => { let r = ''; for (const c of node.childNodes) r += nodeToMd(c, opts); return r }
    const ic = () => { let r = ''; for (const c of node.childNodes) r += nodeToMd(c, { ...opts, inline: true }); return r }

    switch (tag) {
      case 'h1': return '\n\n# ' + ic().trim() + '\n\n'
      case 'h2': return '\n\n## ' + ic().trim() + '\n\n'
      case 'h3': return '\n\n### ' + ic().trim() + '\n\n'
      case 'h4': return '\n\n#### ' + ic().trim() + '\n\n'
      case 'h5': return '\n\n##### ' + ic().trim() + '\n\n'
      case 'h6': return '\n\n###### ' + ic().trim() + '\n\n'
      case 'p': { const c = ch().trim(); return c ? '\n\n' + c + '\n\n' : '' }
      case 'div': {
        const c = ch().trim()
        if (!c) return ''
        if (node.querySelector('p,h1,h2,h3,h4,h5,h6,ul,ol,table,pre,blockquote')) return ch()
        return '\n\n' + c + '\n\n'
      }
      case 'br': return '\n'
      case 'hr': return '\n\n---\n\n'
      case 'strong': case 'b': { const t = ic().trim(); return t ? '**' + t + '**' : '' }
      case 'em': case 'i': { const t = ic().trim(); return t ? '*' + t + '*' : '' }
      case 'del': case 's': { const t = ic().trim(); return t ? '~~' + t + '~~' : '' }
      case 'code': {
        if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') return node.textContent
        const t = node.textContent.trim()
        return t ? '`' + t + '`' : ''
      }
      case 'pre': {
        const ce = node.querySelector('code')
        const t = ce ? ce.textContent : node.textContent
        let lang = ''
        const lc = (ce || node).className.match(/(?:language-|lang-)(\w+)/)
        if (lc) lang = lc[1]
        return '\n\n```' + lang + '\n' + t.trimEnd() + '\n```\n\n'
      }
      case 'a': {
        const href = node.getAttribute('href')
        const t = ic().trim()
        if (!t) return ''
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return t
        let u = href; try { u = new URL(href, location.href).href } catch (_) {}
        return '[' + t + '](' + u + ')'
      }
      case 'img': {
        const alt = node.getAttribute('alt') || ''
        const src = node.getAttribute('src')
        if (!src) return ''
        let u = src; try { u = new URL(src, location.href).href } catch (_) {}
        return '![' + alt + '](' + u + ')'
      }
      case 'ul': {
        let r = '\n\n'
        for (const li of node.children) {
          if (li.tagName.toLowerCase() === 'li') r += '- ' + nodeToMd(li, opts).trim() + '\n'
        }
        return r + '\n'
      }
      case 'ol': {
        let r = '\n\n', i = parseInt(node.getAttribute('start') || '1', 10)
        for (const li of node.children) {
          if (li.tagName.toLowerCase() === 'li') { r += i + '. ' + nodeToMd(li, opts).trim() + '\n'; i++ }
        }
        return r + '\n'
      }
      case 'li': return ch()
      case 'blockquote': {
        const c = ch().trim()
        return '\n\n' + c.split('\n').map(l => '> ' + l).join('\n') + '\n\n'
      }
      case 'table': {
        const rows = []
        for (const tr of node.querySelectorAll('tr')) {
          const cells = []
          for (const cell of tr.children) {
            if (cell.tagName === 'TD' || cell.tagName === 'TH')
              cells.push(cell.textContent.trim().replace(/\|/g, '\\|').replace(/\n/g, ' '))
          }
          rows.push(cells)
        }
        if (!rows.length) return ''
        const cols = Math.max(...rows.map(r => r.length))
        for (const row of rows) while (row.length < cols) row.push('')
        let md = '\n\n| ' + rows[0].join(' | ') + ' |\n| ' + rows[0].map(() => '---').join(' | ') + ' |\n'
        for (let i = 1; i < rows.length; i++) md += '| ' + rows[i].join(' | ') + ' |\n'
        return md + '\n'
      }
      case 'figure': return ch()
      case 'figcaption': { const t = ic().trim(); return t ? '\n*' + t + '*\n' : '' }
      case 'video': case 'audio': case 'source': case 'picture': return ''
      default: return ch()
    }
  }

  function getPageMarkdown() {
    const title = document.title
    const url = location.href
    const root = findMainContent()
    let md = nodeToMd(root)
    md = md.replace(/\n{3,}/g, '\n\n').split('\n').map(l => l.trimEnd()).join('\n').trim()
    const tokens = Math.ceil(md.length / 4)
    const header = '# ' + title + '\n\nSource: ' + url + '\n\n---\n\n'
    return { md: header + md + '\n', tokens }
  }

  // ─── Token formatting ───

  function fmtTokens(n) {
    return n >= 1000 ? '~' + (n / 1000).toFixed(1) + 'K tokens' : '~' + n + ' tokens'
  }

  // ─── Toast ───

  function showToast(msg, ok) {
    const old = document.getElementById('copymd-toast')
    if (old) old.remove()
    const t = document.createElement('div')
    t.id = 'copymd-toast'
    t.textContent = msg
    const pos = cfg.position.split('-')
    const vProp = pos[0] === 'top' ? 'top' : 'bottom'
    const hProp = pos[1] === 'left' ? 'left' : 'right'
    Object.assign(t.style, {
      position: 'fixed', [vProp]: '80px', [hProp]: '24px',
      padding: '10px 16px', borderRadius: '8px',
      background: ok ? '#10b981' : '#ef4444', color: '#fff',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      fontSize: '13px', fontWeight: '500', zIndex: '2147483647',
      boxShadow: '0 4px 12px rgba(0,0,0,.15)', opacity: '0',
      transition: 'opacity .3s ease', pointerEvents: 'none',
    })
    document.body.appendChild(t)
    requestAnimationFrame(() => { t.style.opacity = '1' })
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300) }, 2500)
  }

  // ─── Widget button ───

  function createWidget() {
    const wrap = document.createElement('div')
    wrap.id = 'copymd-widget'

    const pos = cfg.position.split('-')
    const vProp = pos[0] === 'top' ? 'top' : 'bottom'
    const hProp = pos[1] === 'left' ? 'left' : 'right'

    const isDark = cfg.theme === 'dark'

    Object.assign(wrap.style, {
      position: 'fixed', [vProp]: '24px', [hProp]: '24px',
      zIndex: '2147483646', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: hProp === 'right' ? 'flex-end' : 'flex-start',
      gap: '4px',
    })

    // Main button
    const btn = document.createElement('button')
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:6px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' + cfg.label

    Object.assign(btn.style, {
      display: 'inline-flex', alignItems: 'center',
      padding: '10px 16px', border: 'none', borderRadius: '10px',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#e2e8f0' : '#334155',
      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,.12), 0 0 0 1px ' + (isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'),
      transition: 'transform .15s ease, box-shadow .15s ease',
      lineHeight: '1',
    })

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.04)'
      btn.style.boxShadow = '0 4px 16px rgba(0,0,0,.18), 0 0 0 1px ' + (isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)')
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)'
      btn.style.boxShadow = '0 2px 8px rgba(0,0,0,.12), 0 0 0 1px ' + (isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)')
    })

    btn.addEventListener('click', async () => {
      try {
        const { md, tokens } = getPageMarkdown()
        await navigator.clipboard.writeText(md)
        showToast('Copied ' + fmtTokens(tokens) + ' as Markdown', true)
      } catch (e) {
        // Fallback
        try {
          const { md, tokens } = getPageMarkdown()
          const ta = document.createElement('textarea')
          ta.value = md
          ta.style.cssText = 'position:fixed;left:-9999px'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          ta.remove()
          showToast('Copied ' + fmtTokens(tokens) + ' as Markdown', true)
        } catch (e2) {
          showToast('Failed to copy', false)
        }
      }
    })

    wrap.appendChild(btn)

    // "Powered by" link
    if (cfg.branding) {
      const link = document.createElement('a')
      link.href = 'https://github.com/zcag/copymd'
      link.target = '_blank'
      link.rel = 'noopener'
      link.textContent = 'Powered by CopyMD'
      Object.assign(link.style, {
        fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8',
        textDecoration: 'none', padding: '0 4px',
        transition: 'color .2s',
      })
      link.addEventListener('mouseenter', () => { link.style.color = isDark ? '#94a3b8' : '#64748b' })
      link.addEventListener('mouseleave', () => { link.style.color = isDark ? '#64748b' : '#94a3b8' })
      wrap.appendChild(link)
    }

    document.body.appendChild(wrap)
  }

  // ─── Init ───

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget)
  } else {
    createWidget()
  }
})()
