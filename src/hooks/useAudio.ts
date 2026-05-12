import {  useRef } from 'react'
import { Howl } from 'howler'

// const createMockHowl = () => ({
//   play: () => console.log('🔊 Sonido reproducido (mock)'),
//   stop: () => {},
//   loop: () => {},
//   volume: () => {}
// }) as any


const sounds = {
  footsteps: new Howl({ src: ['/sounds/footstep.mp3'], volume: 0.3 }),
  heartBeat: new Howl({ src: ['/sounds/heartbeat.mp3'], volume: 0.5, loop: true }),
  jumpScare: new Howl({ src: ['/sounds/jumpscare.mp3'], volume: 0.8 }),
  ambientDrone: new Howl({ src: ['/sounds/ambient.mp3'], volume: 0.4, loop: true }),
  gunshot: new Howl({ src: ['/sounds/gunshot.mp3'], volume: 0.7 }),
  whisper: new Howl({ src: ['/sounds/whisper.mp3'], volume: 0.6 }),
  reload: new Howl({ src: ['/sounds/reload.mp3'], volume: 0.5 }),
  itemPickup: new Howl({ src: ['/sounds/item.mp3'], volume: 0.4 }),
}

export const useAudio = () => {
  const isPlaying = useRef(false)

  const playAmbient = () => {
    if (!isPlaying.current) {
      try {
        sounds.ambientDrone.play()
        sounds.heartBeat.play()
        isPlaying.current = true
      } catch (e) {
        console.log('Audio no disponible')
      }
    }
  }

  const stopAmbient = () => {
    try {
      sounds.ambientDrone.stop()
      sounds.heartBeat.stop()
      isPlaying.current = false
    } catch (e) {}
  }

  const playJumpScare = () => {
    try {
      sounds.jumpScare.play()
    } catch (e) {}
  }

  const playFootstep = () => {
    try {
      sounds.footsteps.play()
    } catch (e) {}
  }

  const playGunshot = () => {
    try {
      sounds.gunshot.play()
    } catch (e) {}
  }

  const playWhisper = () => {
    try {
      sounds.whisper.play()
    } catch (e) {}
  }

  const playReload = () => {
    try {
      sounds.reload.play()
    } catch (e) {}
  }

  const playItemPickup = () => {
    try {
      sounds.itemPickup.play()
    } catch (e) {}
  }

  return { 
    playAmbient, 
    stopAmbient, 
    playJumpScare, 
    playFootstep, 
    playGunshot, 
    playWhisper,
    playReload,
    playItemPickup
  }
}