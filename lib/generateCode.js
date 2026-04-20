// Consonnes et voyelles pour codes phonétiques français mémorisables
const CONSONANTS = ['B', 'D', 'F', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V']
const VOWELS = ['A', 'E', 'I', 'O', 'U']

function generatePhoneticCode(length = 5) {
  let code = ''
  for (let i = 0; i < length; i++) {
    // Alternate consonant-vowel for easy pronunciation
    if (i % 2 === 0) {
      code += CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]
    } else {
      code += VOWELS[Math.floor(Math.random() * VOWELS.length)]
    }
  }
  return code
}

module.exports = { generatePhoneticCode }
