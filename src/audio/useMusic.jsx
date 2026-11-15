import { useCallback, useEffect, useRef, useState } from 'react'

const KEY = 'ss-music'
const SRC = '/audio/musica-fondo.mp3'
const LEVEL = 0.4

let track = null

function readOn() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

function writeOn(on) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* private mode */
  }
}

function play() {
  if (!track) {
    track = new Audio(SRC)
    track.loop = true
    track.volume = LEVEL
  }
  if (track.paused) track.play().catch(() => {})
}

function silence() {
  if (track) track.pause()
}

function audible() {
  return Boolean(track && !track.paused)
}

export function useMusic() {
  const [on, setOn] = useState(readOn)
  const onRef = useRef(on)

  useEffect(() => {
    if (!on) return undefined
    play()
    const kick = (event) => {
      const el = event.target
      if (el instanceof Element && el.closest('[data-music]')) return
      play()
    }
    const events = ['pointerdown', 'pointerup', 'keydown']
    events.forEach((name) => window.addEventListener(name, kick))
    return () => {
      events.forEach((name) => window.removeEventListener(name, kick))
    }
  }, [on])

  const toggle = useCallback(() => {
    const next = !(onRef.current && audible())
    onRef.current = next
    writeOn(next)
    if (next) play()
    else silence()
    setOn(next)
  }, [])

  return { on, toggle }
}
