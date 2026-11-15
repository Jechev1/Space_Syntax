import { createContext, useContext } from 'react'

const PlayContext = createContext(null)

export function PlayProvider({ value, children }) {
  return <PlayContext.Provider value={value}>{children}</PlayContext.Provider>
}

export function usePlay() {
  const play = useContext(PlayContext)
  if (!play) throw new Error('usePlay must be used inside StageScene')
  return play
}
