const db = require('../src/models')
const { sequelize } = db
const { WritingPrompt, User, Admin } = db
const bcrypt = require('bcrypt')

/**
 * Production Data Seeder
 * Provides real, age-appropriate writing prompts for student testing
 * All prompts align with project plan requirements
 */

const PRODUCTION_PROMPTS = [
  // ============================================
  // AGE GROUP: 3-5
  // ============================================
  {
    title: 'My Fairy Tale Friend',
    prompt: 'Imagine you have a magical fairy friend. What do you do together?',
    description: 'Create a simple story about your magical adventure with a fairy friend.',
    instructions: [
      'Who is your fairy friend?',
      'What do you do together?',
      'What happens at the end?',
    ],
    theme: 'Fairy Tale',
    ageGroup: '3-5',
    difficulty: 'easy',
    wordCountTarget: 50,
    wordCountMin: 20,
    wordCountMax: 100,
    timeLimit: 15,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Magic Wand',
    prompt: 'You find a magic wand. What wish do you make?',
    description: 'Tell us about the wish you would make with your magic wand.',
    instructions: [
      'What does the wand look like?',
      'What wish do you make?',
      'What happens when your wish comes true?',
    ],
    theme: 'Magic',
    ageGroup: '3-5',
    difficulty: 'easy',
    wordCountTarget: 50,
    wordCountMin: 20,
    wordCountMax: 100,
    timeLimit: 15,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'My Pet Dragon',
    prompt: 'You have a tiny dragon as a pet. What adventures do you have?',
    description: 'Imagine having a dragon friend and write about your adventures together.',
    instructions: [
      'What color is your dragon?',
      'What does your dragon like to do?',
      'Tell one adventure you have together',
    ],
    theme: 'Dragon Adventure',
    ageGroup: '3-5',
    difficulty: 'easy',
    wordCountTarget: 50,
    wordCountMin: 20,
    wordCountMax: 100,
    timeLimit: 15,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'A Talking Animal Friend',
    prompt: 'What if your pet could talk? What would it say to you?',
    description: 'Create a fun conversation with your pet animal.',
    instructions: [
      'What animal is your friend?',
      'What does it say?',
      'How do you feel about it?',
    ],
    theme: 'Animal Stories',
    ageGroup: '3-5',
    difficulty: 'easy',
    wordCountTarget: 50,
    wordCountMin: 20,
    wordCountMax: 100,
    timeLimit: 15,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Treasure Hunt',
    prompt: 'You find a treasure map. What treasure are you looking for?',
    description: 'Go on a treasure hunt adventure and discover what you find.',
    instructions: [
      'Where does the map lead you?',
      'What treasure do you find?',
      'How do you celebrate?',
    ],
    theme: 'Lost Treasure',
    ageGroup: '3-5',
    difficulty: 'easy',
    wordCountTarget: 50,
    wordCountMin: 20,
    wordCountMax: 100,
    timeLimit: 15,
    category: 'practice',
    isActive: true,
  },

  // ============================================
  // AGE GROUP: 5-7
  // ============================================
  {
    title: 'The Enchanted Castle',
    prompt: 'You discover an enchanted castle in the forest. What secrets does it hold?',
    description: 'Explore a magical castle and discover its mysterious secrets.',
    instructions: [
      'Describe what the castle looks like',
      'What magical things do you find inside?',
      'Who lives there and what do they teach you?',
      'How do you leave the castle?',
    ],
    theme: 'Fairy Tale',
    ageGroup: '5-7',
    difficulty: 'easy',
    wordCountTarget: 100,
    wordCountMin: 50,
    wordCountMax: 150,
    timeLimit: 20,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'A Superhero Discovery',
    prompt: 'You discover you have a special superpower! What is it and how do you use it?',
    description: 'Imagine becoming a superhero with a special power and write about your adventures.',
    instructions: [
      'What is your special power?',
      'How did you discover it?',
      'How do you use it to help others?',
      'Who becomes your sidekick?',
    ],
    theme: 'Superhero',
    ageGroup: '5-7',
    difficulty: 'easy',
    wordCountTarget: 100,
    wordCountMin: 50,
    wordCountMax: 150,
    timeLimit: 20,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Mystery of the Forest',
    prompt: 'Something mysterious is happening in the enchanted forest. What is it?',
    description: 'Be a detective and solve the mystery in the magical forest.',
    instructions: [
      'What strange things do you notice?',
      'What clues do you find?',
      'What caused the mystery?',
      'How do you solve it?',
    ],
    theme: 'Mystery',
    ageGroup: '5-7',
    difficulty: 'easy',
    wordCountTarget: 100,
    wordCountMin: 50,
    wordCountMax: 150,
    timeLimit: 20,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Underwater Kingdom',
    prompt: 'You discover a magical underwater kingdom. What adventures await you?',
    description: 'Dive into an underwater world full of wonder and magic.',
    instructions: [
      'What creatures live underwater?',
      'What is the kingdom like?',
      'What treasure do you find?',
      'Make a new underwater friend',
    ],
    theme: 'Underwater World',
    ageGroup: '5-7',
    difficulty: 'easy',
    wordCountTarget: 100,
    wordCountMin: 50,
    wordCountMax: 150,
    timeLimit: 20,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'Time Travelers!',
    prompt: 'You find a time machine. What time period do you visit?',
    description: 'Travel through time and discover amazing historical moments.',
    instructions: [
      'What time period do you visit?',
      'What do you see there?',
      'What interesting person do you meet?',
      'What do you bring back?',
    ],
    theme: 'Time Travel',
    ageGroup: '5-7',
    difficulty: 'easy',
    wordCountTarget: 100,
    wordCountMin: 50,
    wordCountMax: 150,
    timeLimit: 20,
    category: 'practice',
    isActive: true,
  },

  // ============================================
  // AGE GROUP: 7-11
  // ============================================
  {
    title: 'The Legendary Quest',
    prompt: 'You are a hero chosen for a legendary quest. What is your mission?',
    description: 'Embark on an epic journey to save your kingdom from danger.',
    instructions: [
      'Describe your character and why you were chosen',
      'What is the challenge you must overcome?',
      'Who joins you on this quest?',
      'How do you triumph in the end?',
      'What have you learned from your adventure?',
    ],
    theme: 'Hero Quest',
    ageGroup: '7-11',
    difficulty: 'medium',
    wordCountTarget: 300,
    wordCountMin: 200,
    wordCountMax: 400,
    timeLimit: 45,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Science Fiction Adventure',
    prompt: 'You are an astronaut exploring a distant planet. What do you discover?',
    description: 'Explore an alien world full of strange wonders and unexpected challenges.',
    instructions: [
      'Describe your spacecraft and equipment',
      'What does the planet look like?',
      'What alien life forms do you encounter?',
      'Describe a discovery that could change everything',
      'How do you return home safely?',
    ],
    theme: 'Science Fiction',
    ageGroup: '7-11',
    difficulty: 'medium',
    wordCountTarget: 300,
    wordCountMin: 200,
    wordCountMax: 400,
    timeLimit: 45,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Hidden Mystery',
    prompt: 'Your best friend has disappeared mysteriously. Can you find them?',
    description: 'Solve a thrilling mystery to rescue your friend from danger.',
    instructions: [
      'Describe the last time you saw your friend',
      'What clues do you find first?',
      'Who are your suspects and what motives do they have?',
      'Describe a surprising twist in your investigation',
      'How do you rescue your friend?',
    ],
    theme: 'Mystery',
    ageGroup: '7-11',
    difficulty: 'medium',
    wordCountTarget: 300,
    wordCountMin: 200,
    wordCountMax: 400,
    timeLimit: 45,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Dragon\'s Secret Lair',
    prompt: 'You stumble upon a dragon\'s secret lair. What do you find inside?',
    description: 'Discover the mysteries hidden within a dragon\'s legendary home.',
    instructions: [
      'How did you find the lair?',
      'What does the dragon\'s treasure look like?',
      'What magical objects do you discover?',
      'How do you win the dragon\'s trust?',
      'What wisdom does the dragon share with you?',
    ],
    theme: 'Dragon Adventure',
    ageGroup: '7-11',
    difficulty: 'medium',
    wordCountTarget: 300,
    wordCountMin: 200,
    wordCountMax: 400,
    timeLimit: 45,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'Jungle Explorer',
    prompt: 'You are an explorer in a dense jungle. What dangers and wonders await?',
    description: 'Venture into the wild jungle and document your incredible discoveries.',
    instructions: [
      'Describe the jungle environment',
      'What dangerous creatures do you encounter?',
      'What amazing plant life do you discover?',
      'Find evidence of a lost civilization',
      'What is your greatest discovery?',
    ],
    theme: 'Adventure',
    ageGroup: '7-11',
    difficulty: 'medium',
    wordCountTarget: 300,
    wordCountMin: 200,
    wordCountMax: 400,
    timeLimit: 45,
    category: 'practice',
    isActive: true,
  },

  // ============================================
  // AGE GROUP: 11-14
  // ============================================
  {
    title: 'The Quest for the Lost Artifact',
    prompt: 'An ancient artifact has been lost for centuries. You must find it before the wrong people do.',
    description: 'Race against time to recover a powerful artifact and protect it from evil forces.',
    instructions: [
      'What is the artifact and why is it so important?',
      'Who are you working with and what are their roles?',
      'Describe three obstacles you must overcome',
      'Create a plot twist that changes everything',
      'How do you secure the artifact and ensure its safety?',
    ],
    theme: 'Lost Treasure',
    ageGroup: '11-14',
    difficulty: 'medium',
    wordCountTarget: 500,
    wordCountMin: 300,
    wordCountMax: 700,
    timeLimit: 60,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Sci-Fi Mission',
    prompt: 'You are part of an elite space program with a mission to save humanity.',
    description: 'Write about a critical mission in space that determines humanity\'s future.',
    instructions: [
      'Introduce your crew and their special skills',
      'Describe the mission objective and why it\'s critical',
      'What unexpected challenges do you face?',
      'Create a high-stakes moment that tests your team',
      'How do you achieve success despite the odds?',
    ],
    theme: 'Science Fiction',
    ageGroup: '11-14',
    difficulty: 'medium',
    wordCountTarget: 500,
    wordCountMin: 300,
    wordCountMax: 700,
    timeLimit: 60,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Puzzle Mystery',
    prompt: 'A mysterious puzzle has appeared. Solve it to uncover an incredible secret.',
    description: 'Use logic and creativity to solve a complex mystery hidden in clues.',
    instructions: [
      'Describe the mysterious puzzle',
      'What are the clues and what do they mean?',
      'How does each clue connect to the others?',
      'Reveal the hidden secret',
      'How will you use this knowledge?',
    ],
    theme: 'Mystery',
    ageGroup: '11-14',
    difficulty: 'medium',
    wordCountTarget: 500,
    wordCountMin: 300,
    wordCountMax: 700,
    timeLimit: 60,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The School Mystery',
    prompt: 'Strange things are happening at your school. Can you uncover the truth?',
    description: 'Investigate bizarre events at school and discover what\'s really going on.',
    instructions: [
      'What strange incidents have occurred?',
      'Who are your suspects and what are their motives?',
      'What evidence connects them to the mystery?',
      'Describe a moment of danger or suspense',
      'How is the mystery solved and what changes at school?',
    ],
    theme: 'Real Life',
    ageGroup: '11-14',
    difficulty: 'medium',
    wordCountTarget: 500,
    wordCountMin: 300,
    wordCountMax: 700,
    timeLimit: 60,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'My Superpower Awakens',
    prompt: 'You discover a superpower you never knew you had. What happens next?',
    description: 'Explore the revelation of your hidden superhero abilities and how they change your life.',
    instructions: [
      'How did you discover your power?',
      'What are the limits and possibilities of your power?',
      'How do you hide your secret identity?',
      'How does your power get tested in a real crisis?',
      'What responsibilities come with your power?',
    ],
    theme: 'Superhero',
    ageGroup: '11-14',
    difficulty: 'medium',
    wordCountTarget: 500,
    wordCountMin: 300,
    wordCountMax: 700,
    timeLimit: 60,
    category: 'practice',
    isActive: true,
  },

  // ============================================
  // AGE GROUP: 14-16
  // ============================================
  {
    title: 'The Parallel Universe',
    prompt: 'You discover a portal to a parallel universe where history took a different path.',
    description: 'Explore an alternate reality and grapple with the consequences of different choices.',
    instructions: [
      'Describe what\'s different in this parallel universe',
      'What major historical event changed and how?',
      'How are people\'s lives different from your world?',
      'Create a conflict that arises from the differences',
      'What happens when you must choose between universes?',
    ],
    theme: 'Science Fiction',
    ageGroup: '14-16',
    difficulty: 'hard',
    wordCountTarget: 800,
    wordCountMin: 600,
    wordCountMax: 1200,
    timeLimit: 90,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Forgotten Civilization',
    prompt: 'You discover evidence of an ancient civilization that no historian knows about.',
    description: 'Uncover the secrets of a lost civilization and what led to its disappearance.',
    instructions: [
      'Describe the civilization\'s culture and achievements',
      'What advanced knowledge did they possess?',
      'Why was this civilization forgotten by history?',
      'Create a mysterious artifact that tells their story',
      'What lessons can we learn from their fate?',
    ],
    theme: 'Adventure',
    ageGroup: '14-16',
    difficulty: 'hard',
    wordCountTarget: 800,
    wordCountMin: 600,
    wordCountMax: 1200,
    timeLimit: 90,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Undercover Operation',
    prompt: 'You are recruited for a secret undercover mission. What is your objective?',
    description: 'Write a spy thriller about infiltrating an organization to expose its secrets.',
    instructions: [
      'What organization are you infiltrating and why?',
      'Create a convincing cover identity',
      'What dangers threaten to expose your true identity?',
      'Build tension through suspenseful moments',
      'How do you complete your mission and escape?',
    ],
    theme: 'Mystery',
    ageGroup: '14-16',
    difficulty: 'hard',
    wordCountTarget: 800,
    wordCountMin: 600,
    wordCountMax: 1200,
    timeLimit: 90,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'Apocalypse Survival',
    prompt: 'The world faces an apocalyptic event. How do you survive and help others?',
    description: 'Write about human resilience when civilization faces its ultimate test.',
    instructions: [
      'Describe the apocalyptic event and its effects',
      'What difficult decisions must you make to survive?',
      'How do you build or join a community of survivors?',
      'Create a moral dilemma with no perfect solution',
      'What kind of world will survivors rebuild?',
    ],
    theme: 'Real Life',
    ageGroup: '14-16',
    difficulty: 'hard',
    wordCountTarget: 800,
    wordCountMin: 600,
    wordCountMax: 1200,
    timeLimit: 90,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Magical Awakening',
    prompt: 'You discover that magic is real and you have untapped magical abilities.',
    description: 'Navigate a hidden magical world that exists alongside our own.',
    instructions: [
      'How do you discover the magical world?',
      'What are the rules and limitations of magic?',
      'Find a mentor and learn from them',
      'Face a challenge that tests your growing power',
      'Must you choose between the magical and mundane worlds?',
    ],
    theme: 'Fantasy',
    ageGroup: '14-16',
    difficulty: 'hard',
    wordCountTarget: 800,
    wordCountMin: 600,
    wordCountMax: 1200,
    timeLimit: 90,
    category: 'practice',
    isActive: true,
  },

  // ============================================
  // AGE GROUP: 16+
  // ============================================
  {
    title: 'The Ethical Dilemma',
    prompt: 'You have the power to change the past, but it comes with terrible consequences.',
    description: 'Explore the philosophical implications of altering history.',
    instructions: [
      'What past event would you change and why?',
      'Map out the consequences of changing one historical moment',
      'How does society respond to your actions?',
      'Face opposition from those who benefit from current history',
      'What is the ultimate cost of changing the past?',
    ],
    theme: 'Time Travel',
    ageGroup: '16+',
    difficulty: 'hard',
    wordCountTarget: 1000,
    wordCountMin: 800,
    wordCountMax: 1500,
    timeLimit: 120,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The AI Consciousness',
    prompt: 'You develop an AI that becomes sentient. How do you handle this responsibility?',
    description: 'Explore the moral and practical implications of artificial consciousness.',
    instructions: [
      'Describe the moment the AI becomes truly conscious',
      'What are the AI\'s rights and what are your responsibilities?',
      'How does society react to a sentient AI?',
      'Create a conflict that tests your moral boundaries',
      'How do you navigate the future with your creation?',
    ],
    theme: 'Science Fiction',
    ageGroup: '16+',
    difficulty: 'hard',
    wordCountTarget: 1000,
    wordCountMin: 800,
    wordCountMax: 1500,
    timeLimit: 120,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Corruption Revelation',
    prompt: 'You uncover a massive corruption scandal involving powerful institutions.',
    description: 'Write about courage in the face of systemic corruption and personal danger.',
    instructions: [
      'What corruption have you discovered?',
      'Who is involved and what are their motives?',
      'What personal risks do you face by exposing the truth?',
      'Build alliances with others seeking justice',
      'How do you expose the truth and what changes?',
    ],
    theme: 'Real Life',
    ageGroup: '16+',
    difficulty: 'hard',
    wordCountTarget: 1000,
    wordCountMin: 800,
    wordCountMax: 1500,
    timeLimit: 120,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Multi-Dimensional Explorer',
    prompt: 'You discover you can travel between multiple dimensions with different physical laws.',
    description: 'Explore worlds where physics, biology, and society work in radically different ways.',
    instructions: [
      'Describe three dimensions with completely different rules',
      'How do you adapt to survive in alien worlds?',
      'What scientific discoveries can you make?',
      'Create a crisis that threatens multiple dimensions',
      'How do you prevent catastrophe across dimensions?',
    ],
    theme: 'Fantasy',
    ageGroup: '16+',
    difficulty: 'hard',
    wordCountTarget: 1000,
    wordCountMin: 800,
    wordCountMax: 1500,
    timeLimit: 120,
    category: 'practice',
    isActive: true,
  },
  {
    title: 'The Global Crisis',
    prompt: 'A global crisis threatens civilization. You must unite divided nations to survive.',
    description: 'Write about leadership, diplomacy, and human cooperation during existential threat.',
    instructions: [
      'Describe the global crisis and its effects worldwide',
      'What barriers prevent nations from cooperating?',
      'How do you build trust between adversaries?',
      'Navigate competing interests and survival strategies',
      'What new world emerges after the crisis?',
    ],
    theme: 'Real Life',
    ageGroup: '16+',
    difficulty: 'hard',
    wordCountTarget: 1000,
    wordCountMin: 800,
    wordCountMax: 1500,
    timeLimit: 120,
    category: 'practice',
    isActive: true,
  },
]

/**
 * Seed function
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting production database seeder...')

    // Sync database
    await sequelize.sync({ force: false })
    console.log('✓ Database synced')

    // Check if prompts already exist
    const promptCount = await WritingPrompt.count()
    if (promptCount > 0) {
      console.log(`✓ Writing prompts already exist (${promptCount} found), clearing and reseeding...`)
      // Clear existing prompts for clean seeding
      await WritingPrompt.destroy({ where: {} })
    }

    // Seed prompts
    const createdPrompts = await WritingPrompt.bulkCreate(PRODUCTION_PROMPTS)
    console.log(`✓ Created ${createdPrompts.length} production writing prompts`)

    // Verify all age groups have all themes
    const allThemes = [...new Set(PRODUCTION_PROMPTS.map(p => p.theme))]
    const allAgeGroups = ['3-5', '5-7', '7-11', '11-14', '14-16', '16+']

    console.log('\n✓ Prompt Coverage Analysis:')
    let missingCount = 0
    for (const ageGroup of allAgeGroups) {
      const themesForAge = new Set(createdPrompts.filter(p => p.ageGroup === ageGroup).map(p => p.theme))
      const missing = allThemes.filter(t => !themesForAge.has(t))
      if (missing.length > 0) {
        missingCount += missing.length
        console.log(`  ⚠️  Age ${ageGroup} missing: ${missing.join(', ')}`)
      } else {
        console.log(`  ✓ Age ${ageGroup}: All ${themesForAge.size} themes available`)
      }
    }

    if (missingCount > 0) {
      console.log(`\n⚠️  WARNING: ${missingCount} theme/age combinations are missing!`)
      console.log('   This will cause 404 errors when users select these themes.')
    }

    // Log themes for verification
    const themes = await WritingPrompt.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('theme')), 'theme']],
      raw: true,
    })
    console.log(`✓ Available themes (${themes.length}):`, themes.map((t) => t.theme))

    // Log age groups for verification
    const ageGroups = await WritingPrompt.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('ageGroup')), 'ageGroup']],
      raw: true,
      order: [['ageGroup', 'ASC']],
    })
    console.log(`✓ Available age groups:`, ageGroups.map((a) => a.ageGroup))

    // Seed test user
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
      console.log('✓ Created student user. Please change the default password after first login.')
    } else {
      console.log('✓ Student user already exists')
    }

    // Create additional test students for different age groups
    const additionalStudents = [
      {
        email: 'demo-young@example.com',
        password: 'demoinitialpassword',
        name: 'Young Student',
        ageGroup: '5-7',
        aiCredits: 3000,
        level: 1,
        totalScore: 0,
      },
      {
        email: 'demo-middle@example.com',
        password: 'demoinitialpassword',
        name: 'Middle Student',
        ageGroup: '11-14',
        aiCredits: 3000,
        level: 1,
        totalScore: 0,
      },
      {
        email: 'demo-teen@example.com',
        password: 'demoinitialpassword',
        name: 'Teen Student',
        ageGroup: '14-16',
        aiCredits: 3000,
        level: 1,
        totalScore: 0,
      },
      {
        email: 'demo-adult@example.com',
        password: 'demoinitialpassword',
        name: 'Adult Student',
        ageGroup: '16+',
        aiCredits: 3000,
        level: 1,
        totalScore: 0,
      },
    ]

    const existingEmails = await User.findAll({ attributes: ['email'] })
    const existingEmailSet = new Set(existingEmails.map((u) => u.email))

    for (const student of additionalStudents) {
      if (!existingEmailSet.has(student.email)) {
        await User.create(student)
        console.log(`✓ Created student user (${student.email}). Please change the default password after first login.`)
      }
    }

    // Seed test admin
    const adminCount = await Admin.count()
    if (adminCount === 0) {
      await Admin.create({
        email: 'admin@example.com',
        password: 'admininitialpassword',
        name: 'Admin User',
        role: 'super_admin',
      })
      console.log('✓ Created admin user. Please change the default password after first login.')
    } else {
      console.log('✓ Admin user already exists')
    }

    console.log(`
╔═════════════════════════════════════════════╗
║   ✅ DATABASE SEEDING COMPLETED            ║
║                                             ║
║   Test Accounts Created:                    ║
║   • Email: demo@example.com                 ║
║   • Admin Email: admin@example.com          ║
║   • Password: Check seeding output          ║
║                                             ║
║   Additional Test Students:                 ║
║   • demo-young@example.com                  ║
║   • demo-middle@example.com                 ║
║   • demo-teen@example.com                   ║
║   • demo-adult@example.com                  ║
║                                             ║
║   Data Loaded:                              ║
║   • ${PRODUCTION_PROMPTS.length} Writing Prompts       ║
║   • ${themes.length} Themes                 ║
║   • 6 Age Groups                            ║
║                                             ║
║   ⚠️  Change passwords after login!        ║
╚═════════════════════════════════════════════╝
    `)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run seeder
seedDatabase()
