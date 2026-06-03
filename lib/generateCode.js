const CONSONANTS = ['B', 'D', 'F', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V']
const VOWELS = ['A', 'E', 'I', 'O', 'U']

export function generatePhoneticCode(length = 5) {
  let code = ''
  for (let i = 0; i < length; i++) {
    if (i % 2 === 0) {
      code += CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]
    } else {
      code += VOWELS[Math.floor(Math.random() * VOWELS.length)]
    }
  }
  return code
}
