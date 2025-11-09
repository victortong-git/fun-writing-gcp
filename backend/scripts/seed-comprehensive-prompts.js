const db = require('../src/models')
const { sequelize } = db
const { WritingPrompt, User, Admin } = db

/**
 * Comprehensive Seeder - Ensures ALL themes exist for ALL age groups
 * This fixes the issue where theme lists don't match available prompts
 */

const THEMES = [
  'Adventure',
  'Animal Stories',
  'Dragon Adventure',
  'Fairy Tale',
  'Fantasy',
  'Hero Quest',
  'Lost Treasure',
  'Magic',
  'Mystery',
  'Real Life',
  'Science Fiction',
  'Superhero',
  'Time Travel',
  'Underwater World',
]

const AGE_GROUPS = ['3-5', '5-7', '7-11', '11-14', '14-16', '16+']

// Mapping of themes to base prompts - one per theme
const THEME_PROMPTS = {
  'Adventure': {
    titles: [
      'Jungle Explorer',
      'Desert Quest',
      'Mountain Climber',
      'Arctic Expedition',
      'Jungle Mystery',
      'Lost World'
    ],
    basePrompt: (title) => `You embark on an adventure: ${title}. What amazing discoveries do you make?`,
    description: 'Explore the world and document incredible discoveries.',
  },
  'Animal Stories': {
    titles: [
      'Talking Animal Friend',
      'Pet Adventure',
      'Wildlife Adventure',
      'Animal Alliance',
      'Zoo Mystery',
      'Animal Kingdom Quest'
    ],
    basePrompt: (title) => `${title}. What happens when you communicate with animals?`,
    description: 'Write about the special connection between humans and animals.',
  },
  'Dragon Adventure': {
    titles: [
      'My Pet Dragon',
      'Dragon Encounter',
      "Dragon's Secret Lair",
      'Dragon Rider',
      'Ancient Dragon',
      'Dragon Guardian'
    ],
    basePrompt: (title) => `${title}. What treasures and wisdom do you discover?`,
    description: 'Explore the magical world of dragons.',
  },
  'Fairy Tale': {
    titles: [
      'Enchanted Castle',
      'Fairy Tale Quest',
      'Magic Mirror',
      'Royal Ball',
      'Cursed Kingdom',
      'Enchanted Forest'
    ],
    basePrompt: (title) => `${title}. What magic unfolds?`,
    description: 'Enter a world of magic and wonder.',
  },
  'Fantasy': {
    titles: [
      'Magical Awakening',
      "Wizard's Academy",
      'Fantasy Realm',
      'Mythical Creature',
      'Enchanted Quest',
      'Magic User'
    ],
    basePrompt: (title) => `${title}. What magical abilities do you possess?`,
    description: 'Discover a world where magic is real.',
  },
  'Hero Quest': {
    titles: [
      'Legendary Quest',
      "Hero's Journey",
      'Chosen One',
      'Quest for Glory',
      'Sacred Mission',
      'Grand Adventure'
    ],
    basePrompt: (title) => `${title}. What obstacles must you overcome to succeed?`,
    description: 'Become the hero your world needs.',
  },
  'Lost Treasure': {
    titles: [
      'Treasure Hunt',
      'Ancient Artifact',
      'Hidden Riches',
      'Treasure Map',
      'Sunken Treasure',
      'Lost Gold'
    ],
    basePrompt: (title) => `${title}. What challenges stand between you and fortune?`,
    description: 'Search for legendary treasures and artifacts.',
  },
  'Magic': {
    titles: [
      'Magic Wand',
      'Spell Discovery',
      'Magic Academy',
      'Enchanted Object',
      'Magical Power',
      'Magic Shop'
    ],
    basePrompt: (title) => `${title}. What magic can you create?`,
    description: 'Explore the wonders of magic.',
  },
  'Mystery': {
    titles: [
      'Mystery of the Forest',
      'Hidden Clues',
      'Puzzle Mystery',
      'School Mystery',
      'Detective Work',
      'Unsolved Riddle'
    ],
    basePrompt: (title) => `${title}. Can you solve this mystery?`,
    description: 'Solve thrilling mysteries and uncover secrets.',
  },
  'Real Life': {
    titles: [
      'School Mystery',
      'Life Challenge',
      'Personal Growth',
      'Community Hero',
      'Tough Decision',
      'Global Crisis'
    ],
    basePrompt: (title) => `${title}. How do you navigate this real-world situation?`,
    description: 'Write about meaningful real-world experiences.',
  },
  'Science Fiction': {
    titles: [
      'Space Mission',
      'Parallel Universe',
      'AI Consciousness',
      'Time Travel Adventure',
      'Alien Contact',
      'Future World'
    ],
    basePrompt: (title) => `${title}. What technological wonders do you encounter?`,
    description: 'Explore futuristic worlds and sci-fi scenarios.',
  },
  'Superhero': {
    titles: [
      'Superpower Discovery',
      'Secret Identity',
      'Super Team',
      'Villain Confrontation',
      'City Protector',
      'Power Awakening'
    ],
    basePrompt: (title) => `${title}. How do you use your powers responsibly?`,
    description: 'Become a superhero and save the day.',
  },
  'Time Travel': {
    titles: [
      'Time Machine',
      'Historical Journey',
      'Past Explorer',
      'Future Vision',
      'Timeline Change',
      'Temporal Adventure'
    ],
    basePrompt: (title) => `${title}. What historical moments do you witness?`,
    description: 'Travel through time and experience different eras.',
  },
  'Underwater World': {
    titles: [
      'Underwater Kingdom',
      'Ocean Explorer',
      'Sea Creature',
      'Sunken City',
      'Mermaid Tale',
      'Deep Sea Mystery'
    ],
    basePrompt: (title) => `${title}. What secrets does the ocean hold?`,
    description: 'Explore the magical underwater realm.',
  },
}

// Word count targets by age group
const WORD_COUNTS = {
  '3-5': { min: 20, max: 100, target: 50 },
  '5-7': { min: 50, max: 150, target: 100 },
  '7-11': { min: 200, max: 400, target: 300 },
  '11-14': { min: 300, max: 700, target: 500 },
  '14-16': { min: 600, max: 1200, target: 800 },
  '16+': { min: 800, max: 1500, target: 1000 },
}

const DIFFICULTIES = {
  '3-5': 'easy',
  '5-7': 'easy',
  '7-11': 'medium',
  '11-14': 'medium',
  '14-16': 'hard',
  '16+': 'hard',
}

const TIME_LIMITS = {
  '3-5': 15,
  '5-7': 20,
  '7-11': 45,
  '11-14': 60,
  '14-16': 90,
  '16+': 120,
}

/**
 * Generate comprehensive prompts: all themes × all age groups
 */
function generatePrompts() {
  const prompts = []
  let promptIndex = 0

  for (const ageGroup of AGE_GROUPS) {
    for (const theme of THEMES) {
      const themeData = THEME_PROMPTS[theme]
      const title = themeData.titles[promptIndex % themeData.titles.length]
      const wordCounts = WORD_COUNTS[ageGroup]
      const difficulty = DIFFICULTIES[ageGroup]
      const timeLimit = TIME_LIMITS[ageGroup]

      prompts.push({
        title: title,
        prompt: themeData.basePrompt(title),
        description: themeData.description,
        instructions: [
          'Start with an engaging opening',
          'Describe the setting vividly',
          'Include at least one challenging moment',
          'Explain how you overcome the challenge',
          'Reflect on what you learned',
        ],
        theme: theme,
        ageGroup: ageGroup,
        difficulty: difficulty,
        wordCountTarget: wordCounts.target,
        wordCountMin: wordCounts.min,
        wordCountMax: wordCounts.max,
        timeLimit: timeLimit,
        category: 'practice',
        isActive: true,
      })

      promptIndex++
    }
  }

  return prompts
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive database seeder...')

    // Sync database
    await sequelize.sync({ force: false })
    console.log('✓ Database synced')

    // Check if prompts already exist
    const promptCount = await WritingPrompt.count()
    if (promptCount > 0) {
      console.log(`✓ Found ${promptCount} existing prompts, clearing for fresh seed...`)
      await WritingPrompt.destroy({ where: {} })
    }

    // Generate all prompts
    const allPrompts = generatePrompts()
    console.log(`\n✓ Generated ${allPrompts.length} comprehensive prompts`)

    // Create in database
    const createdPrompts = await WritingPrompt.bulkCreate(allPrompts)
    console.log(`✓ Created ${createdPrompts.length} prompts in database`)

    // Verify coverage
    console.log('\n✓ Coverage Verification:')
    const coverage = {}
    createdPrompts.forEach(p => {
      const key = `${p.ageGroup}/${p.theme}`
      coverage[key] = true
    })

    let allCovered = true
    for (const ageGroup of AGE_GROUPS) {
      let missing = []
      for (const theme of THEMES) {
        if (!coverage[`${ageGroup}/${theme}`]) {
          missing.push(theme)
          allCovered = false
        }
      }
      if (missing.length === 0) {
        console.log(`  ✓ ${ageGroup}: All ${THEMES.length} themes covered`)
      } else {
        console.log(`  ✗ ${ageGroup}: Missing ${missing.join(', ')}`)
      }
    }

    if (allCovered) {
      console.log('\n✅ Perfect coverage! All themes available for all age groups.')
    }

    // Create/verify test users
    const userCount = await User.count()
    if (userCount === 0) {
      await User.create({
        email: 'demo@example.com',
        password: 'demoinitialpassword',
        name: 'Demo User',
        ageGroup: '11-14',
        aiCredits: 3000,
        level: 1,
        totalScore: 0,
      })
      console.log('\n✓ Created student user. Please change the default password after first login.')
    }

    const adminCount = await Admin.count()
    if (adminCount === 0) {
      await Admin.create({
        email: 'admin@example.com',
        password: 'admininitialpassword',
        name: 'Admin User',
        role: 'super_admin',
      })
      console.log('✓ Created admin user. Please change the default password after first login.')
    }

    console.log(`
╔════════════════════════════════════════════════╗
║   ✅ DATABASE SEEDING COMPLETED                ║
║                                                ║
║   Data Summary:                                ║
║   • Themes: ${THEMES.length}                       ║
║   • Age Groups: ${AGE_GROUPS.length}                    ║
║   • Total Prompts: ${createdPrompts.length}        ║
║   • Coverage: ${allCovered ? 'PERFECT ✅' : 'INCOMPLETE ⚠️'}            ║
║                                                ║
║   All students can now select ANY theme       ║
║   and get a prompt for their age group!       ║
╚════════════════════════════════════════════════╝
    `)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run seeder
seedDatabase()
