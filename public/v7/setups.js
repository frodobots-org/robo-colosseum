// The hardware behind each robot type: the labelled setup photo and the parts list, opened from a robot card.
// Parts, quantities and prices come from the team's purchase sheet (26 Oct 2026); shop links have tracking parameters removed.
import { esc } from '../landing/live.js'

const DIR = new URL('./setups/', import.meta.url).href
const D435 = { item: 'Intel RealSense D435 camera', price: '$630', href: 'https://shopee.sg/Intel%C2%AE-RealSense%E2%84%A2-Depth-Camera-D435-i.1100080160.27455156401' }
const D405 = { item: 'Intel RealSense D405 camera', price: '$650', href: 'https://shopee.sg/Intel-RealSense-Depth-Camera-D405-binocular-stereo-depth-camera-3D-scanning-face-recognition-i.1100080160.22884548594' }
const POWER = { item: 'Portable power station (700 W)', qty: 1, price: '$200', href: 'https://shopee.sg/VANPA-Portable-Power-Station-400W-700W-1200W-AC-220V-Output-Large-Capacity-Battery-Solar-Generator-Powerbank-For-Camping-DC-Type-C-USB-PD-Multi-functional-Port-i.1200685659.24426806287' }
const LAPTOP = { item: 'Aftershock X-16 Pro laptop (RTX 5090)', qty: 1, price: '$5,895', href: 'https://aftershockpc.com/products/aftershock-x-16-pro-ultra-9-290hx-plus-geforce-rtx-5090' }
const USB = { item: 'USB extension cable', price: '$6.59', href: 'https://shopee.sg/Vention-USB-Extension-Cable-Male-To-Female-USB-3.0-Cable-Fast-Speed-Extender-Cord-USB-2.0-Extender-Data-Sync-Cable-For-Laptop-PC-TV-i.95236751.1578425608' }
const HUB = { item: 'USB-C hub (adapter)', qty: 1, price: '$20.70', href: 'https://shopee.sg/UGREEN-USB-C-Hub-Type-C-to-USB-Spliter-4-Ports-USB-3.0-Data-Hub-Compatible-for-Macbook-Pro-Air-2020-iPad-Pro-XPS-Zenbook-ThinkPad-Ideapad-Envy-Elitebook-more-i.64922680.2397125653' }
const TABLE = { item: 'Height-adjustable table', qty: 1, price: '$189', href: 'https://shopee.sg/High-Quality-Pneumatic-height-adjustable-Ergonomic-table-Mobile-Office-Kids-Home-Desk-rectangular-with-lockable-Wheels-i.20047492.20166841283' }
const QUOTE = 'Quote from Unitree'

export const SETUPS = {
  g1: {
    name: 'Unitree G1',
    summary: 'The G1 humanoid with two Dex1-1 parallel grippers, a stereo head camera and a RealSense D405 on each wrist.',
    parts: [
      { item: 'Unitree G1 humanoid', qty: 1, price: QUOTE, href: 'https://www.unitree.com/g1' },
      { item: 'Unitree Dex1-1 gripper', qty: 2, price: QUOTE, href: 'https://www.unitree.com/Dex1-1' },
      { item: 'Unitree Dex1-1 parallel gripper wire', qty: 2, price: QUOTE },
      { item: 'Unitree USB to 4-channel 485 module', qty: 1, price: QUOTE },
      { ...D405, qty: 2 },
      HUB,
      { item: 'HBVCAM stereo head camera (125°, 2.02 mm)', qty: 1, price: '$43.19', href: 'https://item.taobao.com/item.htm?id=680371983853' },
    ],
  },
  yam: {
    name: 'Bimanual YAM',
    summary: 'The MolmoAct2 YAM kit: two arms on a height-adjustable table, an overhead RealSense D435 and a D405 on each wrist, run from an RTX 5090 laptop.',
    parts: [
      { item: 'MolmoAct2 YAM research kit', qty: 1, price: '$6,349', href: 'https://i2rt.com/products/molmoact-2-research-kit' },
      { ...D435, qty: 1 },
      { ...D405, qty: 2 },
      POWER,
      LAPTOP,
      { ...USB, qty: 3 },
      HUB,
      TABLE,
      { item: 'Table extension (60 × 25 cm)', qty: 1, price: '$21.79', href: 'https://shopee.sg/Desktop-Extension-Board-No-Drilling-Expansion-Widening-Board-Computer-Table-Hand-Support-Fold-Long-Wide-Connecting-Board-i.1207866401.42069208542' },
    ],
  },
  franka: {
    name: 'Franka',
    summary: 'A Franka Panda in the DROID setup: two adjustable ZED 2 stereo cameras, a ZED Mini on the wrist, a Robotiq 2F-85 gripper and a Quest 2 headset for teleoperation, on a portable standing desk.',
    guide: { label: 'DROID hardware setup guide', href: 'https://droid-dataset.github.io/droid/docs/hardware-setup' },
  },
  so101: {
    name: 'SO-ARM101',
    summary: 'SO-101 leader and follower arms with an overhead RealSense D435 on a desk mount, on a height-adjustable table with an RTX 5090 laptop.',
    parts: [
      { item: 'SO-101 kit, assembled', qty: 1, price: '$300', href: 'https://shop.wowrobo.com/products/so-arm101-diy-kit-assembled-version-1?variant=46588641607897' },
      { ...D435, qty: 1 },
      POWER,
      LAPTOP,
      { ...USB, qty: 1 },
      HUB,
      TABLE,
      { item: 'Desk mount for the camera (boom arm)', qty: 1, price: '$39.90', href: 'https://shopee.sg/ULANZI-VIJIM-LS08-Desk-Table-Mount-Flexible-Boom-Arm-Light-Camera-Microphone-Mic-Holder-Bracket-Stand-for-Live-Stream-i.391815034.15536938947' },
    ],
  },
}

// One dialog for all robots, filled on open. Closes on Escape, the close button or a click on the backdrop.
export function setupDialog(dialog) {
  dialog.addEventListener('click', e => { if (e.target === dialog || e.target.closest('[data-close]')) dialog.close() })
  return id => {
    const s = SETUPS[id]; if (!s) return
    const rows = s.parts ? s.parts.map(p => `<tr><td>${p.href ? `<a href="${p.href}" target="_blank" rel="noreferrer">${esc(p.item)}</a>` : esc(p.item)}</td><td class="num">${p.qty}</td><td class="num${/\d/.test(p.price) ? '' : ' quote'}">${esc(p.price)}</td></tr>`).join('') : ''
    dialog.innerHTML = `<div class="setup-head"><h2 id="setup-title">${esc(s.name)} setup</h2><button type="button" class="setup-close" data-close aria-label="Close">×</button></div>
      <figure class="setup-figure"><img src="${DIR}${id}.webp" alt="The ${esc(s.name)} evaluation setup with each part labelled"></figure>
      <p class="setup-summary">${esc(s.summary)}</p>
      ${s.parts ? `<h3>Parts list</h3><div class="setup-table"><table><thead><tr><th>Part</th><th class="num">Qty</th><th class="num">Unit price</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="setup-note">Prices as listed in our purchase sheet in October 2026. Most suppliers are in Singapore, so check each link for the current price and currency.</p>`
      : `<p class="setup-guide">Parts list: the <a href="${s.guide.href}" target="_blank" rel="noreferrer">${esc(s.guide.label)}</a>, which this station follows.</p>`}`
    dialog.showModal()
    dialog.scrollTop = 0
  }
}
