# Project Documentation Summary

> This document is auto-generated from source code comments for LLM context.

## class: audioManager

**Brief**: 
    

**Description**: 

    

### private-static-attrib
- `audioContext`
  -          
  - Details:          
- `gainNode`
  -          
  - Details:          
- `isInitialized`
  -          
  - Details:          

### public-static-func
- `init()`
  - Initialize AudioContext on first user interaction. 
  - Details: Browsers often block AudioContext until a user gesture occurs. This method ensures the context is created and ready. 
- `playChime()`
  - Plays a pleasant chime sound. 
  - Details: Uses a synthesized sound to avoid external asset dependencies and ensure snappy loading. Generates a primary sine wave tone (A5) and a triangle harmonic (A6) with decay. @async 
- `vibrate(pattern:number|number[]=200)`
  - Triggers device vibration. 
  - Details: Wrapper around navigator.vibrate. parameterlist:$:kind:param,parameteritem:parameternamelist:parametername:pattern,parameterdescriptio...
- `playCompletionAlert()`
  - Plays the completion alert (Sound + Haptics). 
  - Details: Triggers a double pulse vibration and plays the chime. @async 
- `playTick()`
  - Plays a subtle tick/warning sound. 
  - Details: Used for countdowns (e.g., 3-2-1). Uses a short, high-frequency blip. @async 

---

