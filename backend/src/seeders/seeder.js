const { sequelize, WritingPrompt, User, Admin } = require('../models')
const bcrypt = require('bcrypt')

const THEMES = [
  'adventure',
  'mystery',
  'fantasy',
  'science_fiction',
  'romance',
  'horror',
  'comedy',
  'drama',
  'historical',
  'contemporary',
  'animal_tales',
  'nature',
  'sports',
  'school_life',
  'friendship',
  'family',
  'superheroes',
  'travel',
  'time_travel',
  'cultural',
]

const PROMPTS = [
  {
    title: 'The Mysterious Door',
    prompt: 'You find a mysterious door in your school that you\'ve never seen before. What\'s behind it?',
    description: 'Explore the unknown and let your imagination run wild!',
    instructions: [
      'Describe what you see',
      'Explain how you feel',
      'Tell what happens next',
    ],
    theme: 'mystery',
    ageGroup: '11-14',
    difficulty: 'easy',
    wordCountTarget: 500,
    wordCountMin: 300,
    wordCountMax: 800,
    category: 'practice',
  },
  {
    title: 'A Day in the Life of a Superhero',
    prompt: 'Write about a day in the life of your favorite superhero. What challenges do they face?',
    description: 'Dive into the world of heroes and adventure!',
    instructions: [
      'Start with an interesting scene',
      'Show the hero\'s personality',
      'Include at least one challenge',
    ],
    theme: 'superheroes',
    ageGroup: '7-11',
    difficulty: 'easy',
    wordCountTarget: 400,
    wordCountMin: 200,
    wordCountMax: 600,
    category: 'practice',
  },
  {
    title: 'Lost in the Forest',
    prompt: 'You wake up lost in a dense forest with no memory of how you got there. Write about your adventure.',
    description: 'Survival, exploration, and discovery await you!',
    instructions: [
      'Describe your surroundings',
      'Show your emotions and reactions',
      'Describe how you find your way out',
    ],
    theme: 'adventure',
    ageGroup: '14-16',
    difficulty: 'medium',
    wordCountTarget: 800,
    wordCountMin: 600,
    wordCountMax: 1200,
    category: 'practice',
  },
  {
    title: 'The Last Day of School',
    prompt: 'Write about the last day of your school year. What makes it special?',
    description: 'Capture the emotions and memories of a special moment!',
    instructions: [
      'Include dialogue between characters',
      'Show your feelings about the year',
      'Describe what you\'ll remember',
    ],
    theme: 'school_life',
    ageGroup: '11-14',
    difficulty: 'easy',
    wordCountTarget: 600,
    wordCountMin: 400,
    wordCountMax: 900,
    category: 'practice',
  },
  {
    title: 'Aliens Visit Earth',
    prompt: 'Aliens have landed on Earth! Write about their first encounter with humans.',
    description: 'Imagine a first contact scenario with an extraterrestrial race!',
    instructions: [
      'Describe the aliens\' appearance',
      'Show the humans\' reaction',
      'Predict the outcome of the meeting',
    ],
    theme: 'science_fiction',
    ageGroup: '14-16',
    difficulty: 'medium',
    wordCountTarget: 900,
    wordCountMin: 700,
    wordCountMax: 1300,
    category: 'practice',
  },
]

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeder...')

    // Sync database
    await sequelize.sync({ force: false })
    console.log('✓ Database synced')

    // Check if data already exists
    const promptCount = await WritingPrompt.count()
    if (promptCount > 0) {
      console.log('✓ Writing prompts already exist, skipping...')
    } else {
      // Seed prompts
      await WritingPrompt.bulkCreate(PROMPTS)
      console.log(`✓ Created ${PROMPTS.length} writing prompts`)
    }

    // Check if test user exists
    let testUser = await User.findOne({ where: { email: 'demo@example.com' } })
    if (!testUser) {
      // Create test user (Sequelize hooks will hash the password)
      await User.create({
        email: 'demo@example.com',
        password: 'demoinitialpassword',
        name: 'Demo User',
        ageGroup: '11-14',
        aiCredits: 3000,
        level: 1,
        totalScore: 0,
        isActive: true,
      })
      console.log('✓ Created test user. Please change the default password after first login.')
    } else {
      console.log('✓ Test user already exists')
    }

    // Check if admin exists
    let testAdmin = await Admin.findOne({ where: { email: 'admin@example.com' } })
    if (!testAdmin) {
      // Create test admin (Sequelize hooks will hash the password)
      await Admin.create({
        email: 'admin@example.com',
        password: 'admininitialpassword',
        name: 'Admin User',
        role: 'super_admin',
      })
      console.log('✓ Created test admin. Please change the default password after first login.')
    } else {
      console.log('✓ Test admin already exists')
    }

    console.log('✅ Database seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run seeder
seedDatabase()
