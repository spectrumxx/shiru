import AbstractSource from 'https://esm.sh/gh/RockinChaos/Shiru/extensions/abstract.js'

export default new class NyaaSource extends AbstractSource {
  url = 'https://nyaa.si'

  async validate() {
    try {
      const res = await fetch(`${this.url}/?page=rss&c=1_0&f=0&q=test`)
      return res.ok
    } catch {
      return false
    }
  }

  async _search(query) {
    const url = `${this.url}/?page=rss&c=1_0&f=0&q=${encodeURIComponent(query)}`
    const res = await fetch(url)
    if (!res.ok) return []

    const text = await res.text()
    const parser = new DOMParser()
    const xml = parser.parseFromString(text, 'application/xml')
    const items = [...xml.querySelectorAll('item')]

    return items.map(item => {
      const title = item.querySelector('title')?.textContent ?? ''
      const link = item.querySelector('link')?.textContent ?? ''
      const magnet = item.getElementsByTagNameNS('*', 'magnetUri')?.[0]?.textContent ?? link
      const hash = item.getElementsByTagNameNS('*', 'infoHash')?.[0]?.textContent ?? ''
      const seeders = parseInt(item.getElementsByTagNameNS('*', 'seeders')?.[0]?.textContent ?? '0')
      const leechers = parseInt(item.getElementsByTagNameNS('*', 'leechers')?.[0]?.textContent ?? '0')
      const downloads = parseInt(item.getElementsByTagNameNS('*', 'downloads')?.[0]?.textContent ?? '0')
      const size = parseInt(item.getElementsByTagNameNS('*', 'size')?.[0]?.textContent ?? '0')
      const dateStr = item.querySelector('pubDate')?.textContent ?? ''

      return {
        title,
        link: magnet || link,
        hash,
        seeders,
        leechers,
        downloads,
        size,
        date: dateStr ? new Date(dateStr) : new Date()
      }
    }).filter(r => r.hash || r.link)
  }

  _buildQuery(titles, episode) {
    const title = titles[0] ?? ''
    if (episode != null) {
      return `${title} ${String(episode).padStart(2, '0')}`
    }
    return title
  }

  async single(options) {
    const query = this._buildQuery(options.titles, options.episode)
    return this._search(query)
  }

  async batch(options) {
    const query = this._buildQuery(options.titles, null)
    return this._search(query)
  }

  async movie(options) {
    const query = this._buildQuery(options.titles, null)
    return this._search(query)
  }
}()
