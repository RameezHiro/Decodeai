import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import * as THREE from 'three'

function makePageTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 920
  const context = canvas.getContext('2d')!
  context.fillStyle = '#111a26'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = '#70ecd8'
  context.fillRect(72, 68, 34, 34)
  context.fillStyle = '#09201d'
  context.font = '700 18px Arial, sans-serif'
  context.textAlign = 'center'
  context.fillText('D', 89, 92)
  context.textAlign = 'left'
  context.fillStyle = '#8da5b6'
  context.font = '700 15px Arial, sans-serif'
  context.fillText('DECODE NOTES     /     BIOLOGY 01', 126, 91)
  context.strokeStyle = '#2b3a4c'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(72, 129)
  context.lineTo(1128, 129)
  context.stroke()

  context.fillStyle = '#edf5f7'
  context.font = '52px Georgia, serif'
  context.fillText('The water cycle', 72, 211)
  context.fillStyle = '#91a4b2'
  context.font = '20px Arial, sans-serif'
  context.fillText('How water moves through our world', 74, 254)

  // Main diagram panel.
  context.fillStyle = '#172433'
  context.fillRect(72, 294, 1056, 408)
  context.strokeStyle = '#2b3d4e'
  context.lineWidth = 2
  context.strokeRect(72, 294, 1056, 408)

  const nodes = [
    { x: 254, y: 498, r: 45, fill: '#b49aff', label: 'EVAPORATION', note: 'warmth lifts water' },
    { x: 604, y: 412, r: 49, fill: '#70ecd8', label: 'CONDENSATION', note: 'vapour cools' },
    { x: 953, y: 513, r: 45, fill: '#ff927f', label: 'PRECIPITATION', note: 'water falls back' },
    { x: 608, y: 619, r: 37, fill: '#d2f66d', label: 'COLLECTION', note: 'the cycle begins again' },
  ]
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0]]
  context.strokeStyle = '#718596'
  context.lineWidth = 4
  context.setLineDash([9, 10])
  edges.forEach(([from, to]) => {
    context.beginPath()
    context.moveTo(nodes[from].x, nodes[from].y)
    context.lineTo(nodes[to].x, nodes[to].y)
    context.stroke()
  })
  context.setLineDash([])
  nodes.forEach((node) => {
    context.beginPath()
    context.fillStyle = '#223345'
    context.arc(node.x, node.y, node.r + 9, 0, Math.PI * 2)
    context.fill()
    context.beginPath()
    context.fillStyle = node.fill
    context.arc(node.x, node.y, node.r, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#e5eef2'
    context.font = '700 14px Arial, sans-serif'
    context.textAlign = 'center'
    context.fillText(node.label, node.x, node.y + node.r + 28)
    context.fillStyle = '#97abb7'
    context.font = '14px Arial, sans-serif'
    context.fillText(node.note, node.x, node.y + node.r + 50)
  })
  context.textAlign = 'left'

  context.strokeStyle = '#2b3a4c'
  context.beginPath()
  context.moveTo(72, 750)
  context.lineTo(1128, 750)
  context.stroke()
  context.fillStyle = '#90a5b0'
  context.font = '16px Arial, sans-serif'
  context.fillText('A system in motion — each stage leads to the next.', 72, 794)
  context.fillStyle = '#70ecd8'
  context.font = '700 14px Arial, sans-serif'
  context.textAlign = 'right'
  context.fillText('01  /  03', 1128, 794)
  return new THREE.CanvasTexture(canvas)
}

function roundedCard(width: number, height: number, radius: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-width / 2 + radius, -height / 2)
  shape.lineTo(width / 2 - radius, -height / 2)
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius)
  shape.lineTo(width / 2, height / 2 - radius)
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2)
  shape.lineTo(-width / 2 + radius, height / 2)
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius)
  shape.lineTo(-width / 2, -height / 2 + radius)
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2)
  return shape
}

function makeFloatingLabel(title: string, subtitle: string, tint: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 520
  canvas.height = 210
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#162331'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, 11, canvas.height)
  ctx.fillStyle = '#7b9eaa'
  ctx.font = '700 22px Arial, sans-serif'
  ctx.fillText(subtitle.toUpperCase(), 45, 62)
  ctx.fillStyle = '#eaf3f5'
  ctx.font = '34px Georgia, serif'
  ctx.fillText(title, 45, 124)
  ctx.fillStyle = '#41616a'
  ctx.fillRect(45, 157, 182, 5)
  ctx.fillStyle = '#2b4050'
  ctx.fillRect(45, 174, 126, 5)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export default function HeroScene() {
  const hostRef = useRef<HTMLDivElement>(null)
  const resetButtonRef = useRef<HTMLButtonElement>(null)
  const [webglAvailable, setWebglAvailable] = useState(true)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 0, 8)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      setWebglAvailable(false)
      return () => undefined
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    host.prepend(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xe5f8ff, 0x172438, 2.1))
    const keyLight = new THREE.DirectionalLight(0xd2f7ff, 3.1)
    keyLight.position.set(-3.2, 4.5, 7)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0x9e91ff, 1.5)
    fillLight.position.set(4, -2.5, 4)
    scene.add(fillLight)

    // Soft halo and orbit provide depth without competing with the page.
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(2.75, 72),
      new THREE.MeshBasicMaterial({ color: '#332c67', transparent: true, opacity: 0.58, depthWrite: false }),
    )
    halo.position.set(0.13, -0.03, -1.5)
    scene.add(halo)

    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(2.46, 0.008, 6, 180),
      new THREE.MeshBasicMaterial({ color: '#8a7bdb', transparent: true, opacity: 0.48 }),
    )
    orbit.rotation.set(1.12, 0.07, -0.18)
    orbit.position.z = -0.68
    scene.add(orbit)

    const cardGroup = new THREE.Group()
    scene.add(cardGroup)

    // Layered page edges and a gently bevelled cover create a tangible paper object.
    for (let index = 0; index < 3; index += 1) {
      const shape = roundedCard(3.48, 2.66, 0.12)
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.025, bevelThickness: 0.022, steps: 1 })
      const material = new THREE.MeshStandardMaterial({ color: index === 0 ? '#273442' : '#1a2633', roughness: 0.72, metalness: 0.12 })
      const page = new THREE.Mesh(geometry, material)
      page.position.set(0, 0, -0.1 - index * 0.045)
      page.rotation.x = Math.PI
      cardGroup.add(page)
    }

    const topShape = roundedCard(3.48, 2.66, 0.12)
    const topGeometry = new THREE.ExtrudeGeometry(topShape, { depth: 0.09, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.022, bevelThickness: 0.02, steps: 1 })
    const topPage = new THREE.Mesh(topGeometry, new THREE.MeshStandardMaterial({ color: '#14202d', roughness: 0.68, metalness: 0.1 }))
    topPage.position.set(0, 0, 0.03)
    cardGroup.add(topPage)

    const pageTexture = makePageTexture()
    pageTexture.colorSpace = THREE.SRGBColorSpace
    pageTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
    const frontPage = new THREE.Mesh(
      new THREE.PlaneGeometry(3.31, 2.54),
      new THREE.MeshBasicMaterial({ map: pageTexture, toneMapped: false }),
    )
    // Keep the ink layer slightly above the bevelled face to avoid depth overlap.
    frontPage.position.set(0, 0, 0.16)
    cardGroup.add(frontPage)

    // Floating concept cards sit at different depths, like ideas orbiting a study page.
    const chips: THREE.Group[] = []
    const chipConfigs = [
      { title: 'Observe', subtitle: '01 / Notice', color: '#70ecd8', x: -2.08, y: 1.48, z: 0.58, angle: -0.09 },
      { title: 'Connect', subtitle: '02 / Relate', color: '#b49aff', x: 2.15, y: -0.45, z: 0.62, angle: 0.07 },
    ]
    chipConfigs.forEach((config, index) => {
      const group = new THREE.Group()
      const geometry = new THREE.ShapeGeometry(roundedCard(1.47, 0.59, 0.09))
      const base = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: '#172431', roughness: 0.68, metalness: 0.12, side: THREE.DoubleSide }))
      base.position.z = -0.012
      group.add(base)
      const texture = makeFloatingLabel(config.title, config.subtitle, config.color)
      texture.colorSpace = THREE.SRGBColorSpace
      const label = new THREE.Mesh(new THREE.PlaneGeometry(1.43, 0.56), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide }))
      label.position.z = 0.008
      group.add(label)
      group.position.set(config.x, config.y, config.z)
      group.rotation.z = config.angle
      group.rotation.y = index === 0 ? 0.1 : -0.12
      scene.add(group)
      chips.push(group)
    })

    const nodeMaterial = new THREE.MeshStandardMaterial({ color: '#70ecd8', emissive: '#16464b', emissiveIntensity: 0.45, roughness: 0.38, metalness: 0.16 })
    const nodes = [
      [-2.17, -0.65, 0.1], [2.1, 0.93, -0.3], [-1.7, 1.93, -0.45], [2.45, -1.8, -0.25],
    ].map(([x, y, z]) => {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 18), nodeMaterial)
      node.position.set(x, y, z)
      scene.add(node)
      return node
    })

    const pointer = new THREE.Vector2(0, 0)
    const targetRotation = new THREE.Vector2(0, 0)
    let pointerDown = false
    let previousPointer = new THREE.Vector2(0, 0)
    let frame = 0
    let visible = true
    let disposed = false
    let width = host.clientWidth
    let height = host.clientHeight
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const resize = () => {
      if (!host) return
      width = host.clientWidth
      height = Math.max(240, host.clientHeight)
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.position.z = Math.max(7.2, 5.9 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect))
      camera.updateProjectionMatrix()
    }

    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / bounds.width * 2 - 1
      const y = (event.clientY - bounds.top) / bounds.height * 2 - 1
      pointer.set(x, y)
      if (pointerDown) {
        targetRotation.y = THREE.MathUtils.clamp(targetRotation.y + (x - previousPointer.x) * 0.8, -0.32, 0.32)
        targetRotation.x = THREE.MathUtils.clamp(targetRotation.x + (y - previousPointer.y) * 0.48, -0.2, 0.2)
      }
      previousPointer.set(x, y)
    }
    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true
      host.classList.add('is-dragging')
      previousPointer.set(pointer.x, pointer.y)
      host.setPointerCapture?.(event.pointerId)
    }
    const onPointerUp = () => { pointerDown = false; host.classList.remove('is-dragging') }
    const onPointerLeave = () => { pointerDown = false; host.classList.remove('is-dragging'); pointer.set(0, 0) }
    const onReset = () => { targetRotation.set(0, 0); pointer.set(0, 0) }

    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerdown', onPointerDown)
    host.addEventListener('pointerup', onPointerUp)
    host.addEventListener('pointercancel', onPointerUp)
    host.addEventListener('pointerleave', onPointerLeave)
    resetButtonRef.current?.addEventListener('click', onReset)
    window.addEventListener('resize', resize)
    resize()

    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    observer.observe(host)

    const clock = new THREE.Clock()
    const animate = () => {
      if (disposed) return
      frame = window.requestAnimationFrame(animate)
      if (!visible || document.hidden) return
      const time = clock.getElapsedTime()
      const motionScale = reducedMotion.matches ? 0 : 1
      const pointerEase = reducedMotion.matches ? 0 : 0.045
      if (!pointerDown) {
        targetRotation.y = THREE.MathUtils.lerp(targetRotation.y, pointer.x * 0.095, pointerEase)
        targetRotation.x = THREE.MathUtils.lerp(targetRotation.x, -pointer.y * 0.065, pointerEase)
      }
      cardGroup.rotation.y = THREE.MathUtils.lerp(cardGroup.rotation.y, targetRotation.y + Math.sin(time * 0.34) * 0.025 * motionScale, 0.035)
      cardGroup.rotation.x = THREE.MathUtils.lerp(cardGroup.rotation.x, targetRotation.x + Math.cos(time * 0.3) * 0.018 * motionScale, 0.035)
      cardGroup.position.y = Math.sin(time * 0.55) * 0.045 * motionScale
      chips.forEach((chip, index) => {
        chip.position.y += (chipConfigs[index].y + Math.sin(time * 0.65 + index * 1.6) * 0.055 * motionScale - chip.position.y) * 0.035
        chip.rotation.z = THREE.MathUtils.lerp(chip.rotation.z, chipConfigs[index].angle + pointer.x * (index ? 0.009 : -0.009), 0.035)
      })
      nodes.forEach((node, index) => {
        node.scale.setScalar(1 + Math.sin(time * 1.2 + index) * 0.09 * motionScale)
      })
      renderer.render(scene, camera)
    }
    animate()

    const onVisibilityChange = () => { if (!document.hidden) clock.start() }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerdown', onPointerDown)
      host.removeEventListener('pointerup', onPointerUp)
      host.removeEventListener('pointercancel', onPointerUp)
      host.removeEventListener('pointerleave', onPointerLeave)
      resetButtonRef.current?.removeEventListener('click', onReset)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => {
            const map = 'map' in material ? material.map : null
            map?.dispose()
            material.dispose()
          })
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div className="hero-scene" ref={hostRef} role="group" aria-label="Interactive 3D study-page illustration">
      {!webglAvailable && (
        <div className="scene-fallback-page" aria-hidden="true">
          <div className="fallback-kicker"><span className="fallback-mark">D</span> DECODE NOTES <i /> BIOLOGY 01</div>
          <h2>The water cycle</h2>
          <p>How water moves through our world</p>
          <svg viewBox="0 0 520 190" role="presentation">
            <path d="M115 91 248 43 396 94 260 154 115 91" fill="none" stroke="#718596" strokeWidth="3" strokeDasharray="6 7" />
            <circle cx="115" cy="91" r="29" fill="#b49aff"/><circle cx="248" cy="43" r="29" fill="#70ecd8"/><circle cx="396" cy="94" r="29" fill="#ff927f"/><circle cx="260" cy="154" r="25" fill="#d2f66d"/>
            <text x="115" y="139" textAnchor="middle">EVAPORATION</text><text x="248" y="11" textAnchor="middle">CONDENSATION</text><text x="396" y="143" textAnchor="middle">PRECIPITATION</text><text x="260" y="190" textAnchor="middle">COLLECTION</text>
          </svg>
          <div className="fallback-foot">A system in motion — each stage leads to the next.</div>
        </div>
      )}
      <div className="scene-caption scene-caption-top"><span className="scene-caption-rule" /> FIG. 01 <span>THE LEARNING LOOP</span></div>
      <div className="scene-caption scene-caption-bottom"><span className="scene-caption-mark">✳</span><span>One image.<br /><strong>A clearer idea.</strong></span></div>
      <div className="scene-hint"><span className="scene-hint-dot" /> Drag to explore</div>
      <button ref={resetButtonRef} className="scene-reset" type="button" aria-label="Reset 3D view" title="Reset 3D view" onPointerDown={(event) => event.stopPropagation()}><RotateCcw size={13} /><span>Reset view</span></button>
    </div>
  )
}
