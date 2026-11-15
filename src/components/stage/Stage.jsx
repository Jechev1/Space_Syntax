import { useContext, useId, useLayoutEffect, useRef, useState } from 'react'
import { StageOverlay } from './overlay.jsx'
import styles from './Stage.module.css'

const STAGE_W = 1280
const STAGE_H = 720

const STAR_NEAR = [
  [12, 8], [24, 18], [38, 6], [52, 14], [67, 9], [81, 16], [90, 7],
  [8, 28], [19, 36], [33, 30], [47, 40], [61, 26], [74, 34], [88, 29],
  [15, 48], [29, 54], [44, 46], [58, 58], [72, 50], [86, 46],
]

const STAR_FAR = [
  [6, 12], [18, 4], [31, 16], [46, 8], [63, 18], [77, 5], [94, 14],
  [11, 22], [27, 24], [41, 20], [55, 32], [70, 22], [84, 38], [93, 24],
]

function starImage(points, color) {
  return points
    .map(([x, y]) => `radial-gradient(circle at ${x}% ${y}%, ${color} 2px, transparent 3px)`)
    .join(', ')
}

export function Stage({ background = '', framed = false, objects = null, character = null, children }) {
  const grainId = useId().replace(/:/g, '')
  const overlay = useContext(StageOverlay)
  const frameRef = useRef(null)
  const photo = Boolean(background)
  const scale = useStageScale(frameRef)
  const portrait = typeof character === 'string'
    ? <img className={styles.portrait} src={character} alt="" />
    : character
  const grain = (
    <>
      <svg className={styles.grainSvg} aria-hidden="true">
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        </filter>
      </svg>
      <div className={styles.grain} style={{ filter: `url(#${grainId})` }} aria-hidden="true" />
    </>
  )

  if (photo || framed) {
    return (
      <div className={`${styles.viewport} ${styles.photoStage}`} ref={frameRef}>
        <div className={styles.frame}>
          {photo ? <img className={styles.photo} src={background} alt="" /> : (
            <>
              <div className={styles.sky} aria-hidden="true" />
              <div className={styles.stars} style={{ backgroundImage: starImage(STAR_NEAR, 'var(--text)') }} aria-hidden="true" />
              <div className={`${styles.stars} ${styles.starsFar}`} style={{ backgroundImage: starImage(STAR_FAR, 'var(--text-dim)') }} aria-hidden="true" />
            </>
          )}
          {grain}
          <div className={styles.objects}>{objects}</div>
          <div className={styles.character}>{portrait}</div>
          <div className={styles.ui}>{children}{overlay}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.viewport} ref={frameRef}>
      <div className={styles.fit} style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div className={styles.stage} style={{ transform: `scale(${scale})` }}>
          <div className={styles.sky} aria-hidden="true" />
          <div className={styles.stars} style={{ backgroundImage: starImage(STAR_NEAR, 'var(--text)') }} aria-hidden="true" />
          <div className={`${styles.stars} ${styles.starsFar}`} style={{ backgroundImage: starImage(STAR_FAR, 'var(--text-dim)') }} aria-hidden="true" />
          <div className={styles.fog} aria-hidden="true" />
          {grain}
          <div className={styles.objects}>{objects}</div>
          <div className={styles.character}>{portrait}</div>
          <div className={styles.ui}>{children}{overlay}</div>
        </div>
      </div>
    </div>
  )
}

function useStageScale(ref) {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const fit = () => {
      const box = el.getBoundingClientRect()
      const next = Math.min(box.width / STAGE_W, box.height / STAGE_H)
      setScale(next > 0 ? next : 1)
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return scale
}
