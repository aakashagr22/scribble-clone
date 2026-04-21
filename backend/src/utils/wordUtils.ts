export function getRandomWords(count: number): string[] {
  
  const words = [
    "apple", "banana", "cat", "dog", "elephant", "frog", "guitar", "house", "igloo", "jungle",
    "kangaroo", "lemon", "mountain", "ninja", "ocean", "piano", "queen", "robot", "sun", "tree",
    "umbrella", "volcano", "window", "xylophone", "yacht", "zebra", "astronaut", "bicycle", "castle"
  ];
  
  const shuffled = words.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getLevenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, 
          Math.min(
            matrix[i][j - 1] + 1, 
            matrix[i - 1][j] + 1 
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
