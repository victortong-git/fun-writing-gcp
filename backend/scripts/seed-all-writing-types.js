/**
 * Comprehensive Seeder for All Writing Types
 *
 * Generates prompts for all 6 writing types × 6 age groups = 36+ prompts minimum
 * Plus creative writing themes (14 themes × 6 age groups = 84 prompts)
 * Total: 120+ high-quality, diverse writing prompts
 *
 * Writing Types:
 * 1. Creative - Story-based with themes
 * 2. Persuasive - Argument/debate based
 * 3. Descriptive - Sensory/detail-focused
 * 4. Narrative - Personal/autobiographical
 * 5. Informative - Explanatory/educational
 * 6. Poems - Poetry forms (haiku, acrostic, free verse, etc.)
 */

const db = require('../src/models');

const AGE_GROUPS = ['3-5', '5-7', '7-11', '11-14', '14-16', '16+'];

const DIFFICULTY_BY_AGE = {
  '3-5': 'easy',
  '5-7': 'easy',
  '7-11': 'medium',
  '11-14': 'medium',
  '14-16': 'hard',
  '16+': 'hard',
};

const WORD_COUNTS_BY_AGE = {
  '3-5': { min: 20, max: 100, target: 50 },
  '5-7': { min: 50, max: 200, target: 100 },
  '7-11': { min: 100, max: 400, target: 250 },
  '11-14': { min: 200, max: 600, target: 400 },
  '14-16': { min: 400, max: 1000, target: 700 },
  '16+': { min: 600, max: 1500, target: 1000 },
};

const TIME_LIMITS_BY_AGE = {
  '3-5': 15,
  '5-7': 20,
  '7-11': 30,
  '11-14': 45,
  '14-16': 60,
  '16+': 120,
};

// ==================== CREATIVE WRITING WITH THEMES ====================

const CREATIVE_THEMES = {
  'Adventure': {
    titles: ['Jungle Explorer', 'Desert Quest', 'Mountain Climb', 'Island Discovery'],
    basePrompt: (title, ageGroup) =>
      `Your character sets out on an exciting adventure in search of ${ageGroup.includes('3-5') || ageGroup.includes('5-7') ? 'treasure' : 'lost artifacts'}. Write a story about their journey, the challenges they face, and what they discover.`,
    description: 'Explore thrilling journeys and exciting expeditions',
  },
  'Animal Stories': {
    titles: ['Pet Adventure', 'Forest Friends', 'Zoo Mystery', 'Talking Animals'],
    basePrompt: (title, ageGroup) =>
      `Write a story featuring an animal as the main character. The animal can talk and think like a human. What adventure or challenge does it face?`,
    description: 'Stories centered around animals and wildlife',
  },
  'Dragon Adventure': {
    titles: ['Dragon\'s Secret Lair', 'Dragon Keeper', 'Baby Dragon', 'Dragon Quest'],
    basePrompt: (title, ageGroup) =>
      `Dragons are magical creatures. Write a story about ${['3-5', '5-7'].includes(ageGroup) ? 'a friendly dragon' : 'encountering a dragon'}. What makes this dragon special?`,
    description: 'Adventures featuring dragons and magic',
  },
  'Fairy Tale': {
    titles: ['Royal Ball', 'Enchanted Castle', 'Magical Wish', 'Once Upon a Time'],
    basePrompt: (title, ageGroup) =>
      `Create your own fairy tale. It can feature magic, royalty, enchantments, or happily-ever-afters. What happens in your story?`,
    description: 'Classic fairy tale adventures with magic and wonder',
  },
  'Fantasy': {
    titles: ['Enchanted Quest', 'Magical World', 'Fantasy Kingdom', 'Spell Workshop'],
    basePrompt: (title, ageGroup) =>
      `Imagine a fantastical world with magic. Write a story about a character who discovers or uses ${ageGroup.includes('3-5') || ageGroup.includes('5-7') ? 'magical powers' : 'their magical abilities'}. What do they do?`,
    description: 'Fantasy worlds filled with magic and wonder',
  },
  'Hero Quest': {
    titles: ['Grand Adventure', 'Hero\'s Journey', 'Quest Begins', 'The Champion'],
    basePrompt: (title, ageGroup) =>
      `Write a story about a hero on a quest. The hero has a special power, skill, or quality that helps them succeed. What is their quest and how do they overcome obstacles?`,
    description: 'Heroic journeys and epic quests',
  },
  'Lost Treasure': {
    titles: ['Treasure Hunt', 'Hidden Gold', 'Map to Fortune', 'Pirate Adventure'],
    basePrompt: (title, ageGroup) =>
      `Someone discovers an old map or clue leading to lost treasure. Write about their search. What challenges do they face? Do they find it?`,
    description: 'Thrilling treasure hunting adventures',
  },
  'Magic': {
    titles: ['Spell Discovery', 'Magic Potion', 'Wizard\'s Tower', 'Enchanted Objects'],
    basePrompt: (title, ageGroup) =>
      `Write a story about someone who discovers magic. It could be a magic wand, spell, potion, or magical object. What can they do with it?`,
    description: 'Stories centered on magical powers and enchantments',
  },
  'Mystery': {
    titles: ['Puzzle Mystery', 'Secret Clues', 'The Missing Case', 'Mysterious Discovery'],
    basePrompt: (title, ageGroup) =>
      `A mystery needs to be solved! Write a story about ${['3-5', '5-7'].includes(ageGroup) ? 'finding something lost' : 'uncovering a secret'}}. How do your characters solve it?`,
    description: 'Intriguing mysteries and secrets to solve',
  },
  'Real Life': {
    titles: ['Community Hero', 'Helping Hand', 'School Adventure', 'Family Story'],
    basePrompt: (title, ageGroup) =>
      `Write a realistic story about ${['3-5', '5-7'].includes(ageGroup) ? 'you and your friends or family' : 'a character in a real-world situation'}}. What happens that makes it interesting?`,
    description: 'Stories about everyday life and real experiences',
  },
  'Science Fiction': {
    titles: ['Alien Contact', 'Future World', 'Space Explorer', 'Tech Innovation'],
    basePrompt: (title, ageGroup) =>
      `Imagine the future or an alien world. Write a story set in space, on another planet, or in a futuristic city. What do you discover?`,
    description: 'Science fiction tales of the future and beyond',
  },
  'Superhero': {
    titles: ['Power Awakening', 'Secret Identity', 'Hero Training', 'Superhero Team'],
    basePrompt: (title, ageGroup) =>
      `Create a superhero character. What are their powers? How did they get them? Write a story about them using their powers to ${ageGroup.includes('3-5') || ageGroup.includes('5-7') ? 'help others' : 'face a challenge'}}`,
    description: 'Superhero adventures and extraordinary powers',
  },
  'Time Travel': {
    titles: ['Time Machine', 'Journey Through Time', 'Past Adventure', 'Future Leap'],
    basePrompt: (title, ageGroup) =>
      `Imagine you can travel through time! Write a story about visiting the ${['3-5', '5-7'].includes(ageGroup) ? 'past' : 'past or future'}}. What do you discover?`,
    description: 'Adventures across time and history',
  },
  'Underwater World': {
    titles: ['Ocean Explorer', 'Mermaid\'s Tale', 'Deep Sea Discovery', 'Water Kingdom'],
    basePrompt: (title, ageGroup) =>
      `Explore an underwater world! Write a story about {{character}} discovering amazing creatures, cities, or treasures beneath the sea. What wonders do they find?`,
    description: 'Magical underwater adventures and discoveries',
  },
};

// ==================== PERSUASIVE WRITING ====================

const PERSUASIVE_PROMPTS = {
  '3-5': [
    {
      title: 'Why You Should Have More Playtime',
      prompt: 'Write about why you think playtime is important. Tell reasons why playtime should be longer.',
      description: 'Persuade readers about the value of play',
      instructions: [
        'Give at least 2 reasons why playtime is important',
        'Use words like "because," "also," and "so"',
        'Tell how you feel about playtime',
      ],
    },
    {
      title: 'Your Favorite Food',
      prompt: 'Convince someone to try your favorite food. Tell them why it is delicious and good for you.',
      description: 'Persuade someone to like your favorite food',
      instructions: [
        'Describe what the food tastes like',
        'Give 2 reasons why it is good to eat',
        'Tell what makes it special',
      ],
    },
  ],
  '5-7': [
    {
      title: 'School Should Have More Recess',
      prompt: 'Write a letter to your principal explaining why your school should have more time for recess and outdoor play.',
      description: 'Persuade school leaders about recess',
      instructions: [
        'State your main idea clearly',
        'Give at least 2 reasons why more recess is good',
        'Explain how it helps students',
      ],
    },
    {
      title: 'Why Everyone Should Read This Book',
      prompt: 'Recommend a book you love to other students. Tell them why they should read it.',
      description: 'Convince others to read a book',
      instructions: [
        'Name the book and author',
        'Describe what happens briefly',
        'Give reasons why it is worth reading',
      ],
    },
  ],
  '7-11': [
    {
      title: 'Should School Start Later?',
      prompt: 'Write an argument for or against starting school later in the morning. Support your position with reasons.',
      description: 'Debate the school start time',
      instructions: [
        'State your position clearly in the first paragraph',
        'Give at least 3 reasons that support your view',
        'Address potential counterarguments',
      ],
    },
    {
      title: 'Why Your Class Should Take a Field Trip',
      prompt: 'Convince your teacher that your class should go on a specific field trip. Explain the educational benefits.',
      description: 'Persuade teachers about a field trip',
      instructions: [
        'Choose an interesting field trip location',
        'Explain what you would learn there',
        'Show how it connects to your studies',
      ],
    },
  ],
  '11-14': [
    {
      title: 'Should Students Have Less Homework?',
      prompt: 'Write a persuasive essay arguing whether the amount of homework students receive should be reduced, maintained, or increased.',
      description: 'Debate academic workload',
      instructions: [
        'Write a clear thesis statement',
        'Provide 3-4 well-developed supporting arguments',
        'Include evidence or examples for each argument',
        'Address opposing viewpoints',
      ],
    },
    {
      title: 'Why Your Community Needs [Something]',
      prompt: 'Choose something your community needs (better playground, library, park, etc.) and write a persuasive piece convincing decision-makers to support it.',
      description: 'Advocate for community improvement',
      instructions: [
        'Identify a real community need',
        'Explain why it matters',
        'Provide 3-4 reasons why this should be prioritized',
        'Suggest how to implement the solution',
      ],
    },
  ],
  '14-16': [
    {
      title: 'Technology\'s Impact on Society',
      prompt: 'Write a persuasive essay about whether technology has had more positive or negative effects on modern society.',
      description: 'Argue about technology\'s societal impact',
      instructions: [
        'Present a nuanced thesis considering multiple perspectives',
        'Support with 4-5 detailed, well-researched arguments',
        'Use credible evidence and examples',
        'Acknowledge and refute counterarguments effectively',
        'Conclude with a call to action or broader implications',
      ],
    },
    {
      title: 'Social Media and Youth: Beneficial or Harmful?',
      prompt: 'Argue whether social media is primarily beneficial or detrimental to young people\'s development.',
      description: 'Debate social media\'s effects on youth',
      instructions: [
        'Define your position with a strong thesis',
        'Analyze psychological, social, and academic impacts',
        'Support arguments with relevant research or examples',
        'Address the complexity of the issue',
        'Propose solutions or recommendations',
      ],
    },
  ],
  '16+': [
    {
      title: 'Climate Change Policy: Individual vs. Systemic Action',
      prompt: 'Write a persuasive essay arguing whether addressing climate change should focus primarily on individual responsibility, systemic/governmental changes, or both.',
      description: 'Debate climate action approaches',
      instructions: [
        'Establish a sophisticated, debatable thesis',
        'Present 4-5 substantive arguments with detailed analysis',
        'Integrate credible research, data, and expert perspectives',
        'Deconstruct opposing viewpoints with logical rigor',
        'Explore implications and propose comprehensive solutions',
        'Consider economic, environmental, and social dimensions',
      ],
    },
    {
      title: 'Artificial Intelligence and the Future of Work',
      prompt: 'Argue for a specific policy or approach regarding artificial intelligence\'s role in the future workplace.',
      description: 'Debate AI\'s workplace impact',
      instructions: [
        'Present a nuanced argument about AI integration',
        'Support with 5+ sophisticated reasoning points',
        'Analyze economic and societal consequences',
        'Address ethical considerations',
        'Propose realistic policy frameworks',
        'Evaluate stakeholder impacts comprehensively',
      ],
    },
  ],
};

// ==================== DESCRIPTIVE WRITING ====================

const DESCRIPTIVE_PROMPTS = {
  '3-5': [
    {
      title: 'Describe Your Pet',
      prompt: 'Write a description of a pet. Tell what it looks like, how it moves, and what sounds it makes.',
      description: 'Paint a picture with words about an animal',
      instructions: [
        'Describe what the animal looks like',
        'Tell what sounds it makes',
        'Describe how it moves or plays',
      ],
    },
    {
      title: 'Your Favorite Place',
      prompt: 'Describe a place you like to go. Tell what you see, hear, and feel there.',
      description: 'Describe a special location',
      instructions: [
        'Tell what you see there',
        'Describe the colors and shapes',
        'Tell how you feel when you are there',
      ],
    },
  ],
  '5-7': [
    {
      title: 'Describe the Weather',
      prompt: 'Write a detailed description of a rainy day, sunny day, snowy day, or windy day. Use descriptive words.',
      description: 'Describe weather in vivid detail',
      instructions: [
        'Use sensory words (words that describe what you see, hear, feel, smell, taste)',
        'Describe how the weather makes the world look different',
        'Tell how the weather makes you feel',
      ],
    },
    {
      title: 'A Delicious Food',
      prompt: 'Describe your favorite food in detail. What does it look like? What does it taste like?',
      description: 'Describe food using sensory details',
      instructions: [
        'Describe the color and appearance',
        'Tell what it tastes like',
        'Describe the texture (smooth, crunchy, soft, etc.)',
      ],
    },
  ],
  '7-11': [
    {
      title: 'Describe a Character',
      prompt: 'Choose a character from a book, movie, or someone you know. Write a detailed physical description plus personality traits.',
      description: 'Create a vivid character portrait',
      instructions: [
        'Describe physical appearance in detail',
        'Use specific descriptive words, not just "nice" or "pretty"',
        'Include personality traits shown through appearance or behavior',
        'Help reader feel like they know the person',
      ],
    },
    {
      title: 'A Magical or Unusual Place',
      prompt: 'Describe a fantasy location, alien world, or unusual real place. Use vivid sensory details.',
      description: 'Describe an imaginative setting',
      instructions: [
        'Describe the landscape and geography',
        'Include sensory details (what you see, hear, smell, feel)',
        'Create mood through description',
        'Help reader visualize the location',
      ],
    },
  ],
  '11-14': [
    {
      title: 'Describe an Emotion Through Setting',
      prompt: 'Choose an emotion (joy, fear, loneliness, anger). Describe a place that captures this emotion through its details.',
      description: 'Use setting to convey emotion',
      instructions: [
        'Choose a specific emotion to focus on',
        'Select or create a setting that reflects this emotion',
        'Use sensory details to evoke the feeling',
        'Show rather than tell the emotion',
        'Use figurative language (metaphors, similes)',
      ],
    },
    {
      title: 'Describe a Transformation',
      prompt: 'Describe how a place, person, or object changes. Focus on specific details that show the transformation.',
      description: 'Capture change through descriptive writing',
      instructions: [
        'Describe the initial state in detail',
        'Show stages of change',
        'Describe the final state',
        'Use transitions that show the passage of time',
        'Make the transformation vivid and clear',
      ],
    },
  ],
  '14-16': [
    {
      title: 'Atmospheric Description',
      prompt: 'Write a richly detailed description of a place during a specific moment that captures atmosphere and mood.',
      description: 'Create immersive atmosphere through description',
      instructions: [
        'Establish clear setting and time',
        'Layer sensory details (sight, sound, smell, taste, touch)',
        'Use sophisticated descriptive vocabulary',
        'Create a specific atmosphere or mood',
        'Show perspective and human experience in the setting',
      ],
    },
    {
      title: 'Describe a Complex Object or Process',
      prompt: 'Choose something intricate (a piece of art, mechanism, natural phenomenon). Describe it with technical precision and artistic language.',
      description: 'Describe complexity with clarity and artistry',
      instructions: [
        'Provide accurate technical details',
        'Use accessible but sophisticated language',
        'Help non-experts understand through metaphor and analogy',
        'Include multiple perspectives or viewpoints',
        'Create engagement through detailed observation',
      ],
    },
  ],
  '16+': [
    {
      title: 'Phenomenological Description',
      prompt: 'Write a detailed description that explores how a place or object is experienced—not just how it appears, but how it\'s felt, perceived, and understood.',
      description: 'Explore subjective experience through description',
      instructions: [
        'Move beyond literal description to experiential analysis',
        'Include philosophical or psychological dimensions',
        'Use sophisticated sensory and emotional vocabulary',
        'Employ literary techniques (imagery, metaphor, symbolism)',
        'Explore what the description reveals about human perception',
      ],
    },
    {
      title: 'Describe the Intersection of Personal and Cultural Identity',
      prompt: 'Describe a person, place, or tradition that represents your cultural heritage or identity. Include both objective details and personal significance.',
      description: 'Merge personal and cultural perspective',
      instructions: [
        'Describe with cultural specificity and accuracy',
        'Include personal emotional and historical connection',
        'Examine cultural significance and meaning',
        'Use language that honors the subject',
        'Explore how identity is expressed through detail',
      ],
    },
  ],
};

// ==================== NARRATIVE/AUTOBIOGRAPHICAL ====================

const NARRATIVE_PROMPTS = {
  '3-5': [
    {
      title: 'My Best Day Ever',
      prompt: 'Write about a day that was really fun or special for you. Tell what happened.',
      description: 'Share a memorable personal experience',
      instructions: [
        'Tell what happened in order',
        'Tell what you did',
        'Tell how you felt',
      ],
    },
    {
      title: 'When I Learned Something New',
      prompt: 'Write about a time when you learned to do something new. How did you feel?',
      description: 'Share a learning experience',
      instructions: [
        'Tell what you wanted to learn',
        'Tell the steps you took',
        'Tell how you felt when you learned it',
      ],
    },
  ],
  '5-7': [
    {
      title: 'A Challenge I Overcame',
      prompt: 'Write about a time when something was hard for you. How did you keep trying? What did you learn?',
      description: 'Share about perseverance and growth',
      instructions: [
        'Describe the challenge clearly',
        'Tell what you did to solve it',
        'Explain what you learned',
      ],
    },
    {
      title: 'My Most Exciting Adventure',
      prompt: 'Write about something exciting that happened to you. Include details about where you were and what you did.',
      description: 'Narrate an exciting personal experience',
      instructions: [
        'Set the scene with details',
        'Tell events in order',
        'Explain why it was exciting',
      ],
    },
  ],
  '7-11': [
    {
      title: 'A Turning Point in My Life',
      prompt: 'Write about a moment or experience that changed how you see things or changed what you do. Explain why it was important.',
      description: 'Share a significant personal experience',
      instructions: [
        'Describe the situation and your feelings before',
        'Tell what happened clearly and in detail',
        'Explain how it changed you',
        'Reflect on what you learned',
      ],
    },
    {
      title: 'When I Felt Really Proud',
      prompt: 'Write about a time you did something you felt proud of. What did you accomplish? Why did it matter?',
      description: 'Share an achievement and its meaning',
      instructions: [
        'Describe the goal or challenge',
        'Tell the steps you took',
        'Explain why you felt proud',
        'Reflect on what this taught you',
      ],
    },
  ],
  '11-14': [
    {
      title: 'How I\'ve Grown and Changed',
      prompt: 'Write about how you\'ve changed over the past few years. What makes you different now than you used to be? What caused these changes?',
      description: 'Reflect on personal growth and development',
      instructions: [
        'Identify specific ways you\'ve changed',
        'Include concrete examples from your life',
        'Analyze what caused these changes',
        'Reflect on what\'s important about this growth',
        'Consider implications for your future',
      ],
    },
    {
      title: 'A Relationship That Shaped Me',
      prompt: 'Write about someone who has been important in your life. How have they influenced you? What did you learn from them?',
      description: 'Explore impact of relationships',
      instructions: [
        'Describe the person and your relationship',
        'Give specific examples of their influence',
        'Analyze what they taught you',
        'Reflect on how you\'re different because of them',
        'Consider how this person shaped who you are',
      ],
    },
  ],
  '14-16': [
    {
      title: 'Defining Moment: Identity and Choice',
      prompt: 'Write about a moment when you made a significant choice or realized something important about yourself. How did it shape your identity?',
      description: 'Explore identity-defining experiences',
      instructions: [
        'Set the historical and emotional context',
        'Describe the decision or realization in detail',
        'Analyze competing values or perspectives',
        'Trace consequences of this moment',
        'Reflect on its ongoing influence on your identity',
      ],
    },
    {
      title: 'A Failure That Led to Growth',
      prompt: 'Write about a significant failure or disappointment. How did you respond? What did you learn? How has it shaped your approach to challenges?',
      description: 'Examine resilience and growth through failure',
      instructions: [
        'Describe the situation and your initial reaction',
        'Be honest about the emotional impact',
        'Explain your process of coming to terms with it',
        'Analyze what you learned and how you changed',
        'Reflect on how this experience informs current goals',
      ],
    },
  ],
  '16+': [
    {
      title: 'Coming of Age: Transition to a New Version of Myself',
      prompt: 'Write a reflective narrative about a period of significant transition in your life—moving between worlds, identities, or understandings of yourself.',
      description: 'Explore major life transitions and identity transformation',
      instructions: [
        'Establish the historical, cultural, and personal context',
        'Narrate the transition with sensory and emotional detail',
        'Analyze internal conflicts and growth',
        'Include multiple perspectives (how others saw the change)',
        'Reflect on lasting impact and ongoing evolution',
      ],
    },
    {
      title: 'Examining My Values and Beliefs',
      prompt: 'Write a narrative essay exploring how your core values and beliefs developed. Include key experiences, influences, and moments of realization.',
      description: 'Examine the formation of your values and beliefs',
      instructions: [
        'Identify 2-3 core values or beliefs',
        'Trace their origins in your personal history',
        'Include pivotal moments that reinforced these beliefs',
        'Acknowledge evolution and complexity in your thinking',
        'Reflect on how these values guide your decisions',
      ],
    },
  ],
};

// ==================== INFORMATIVE/EXPLANATORY ====================

const INFORMATIVE_PROMPTS = {
  '3-5': [
    {
      title: 'How to Make a Sandwich',
      prompt: 'Write steps for making a simple sandwich. Explain each step clearly so someone could follow your directions.',
      description: 'Explain a simple process with steps',
      instructions: [
        'Write the steps in order',
        'Use words like "first," "next," and "last"',
        'Tell what materials you need',
      ],
    },
    {
      title: 'All About My Favorite Animal',
      prompt: 'Pick an animal you like. Write facts about it. Where does it live? What does it eat? What does it look like?',
      description: 'Share facts about an animal',
      instructions: [
        'Tell where the animal lives',
        'Describe what it looks like',
        'Tell what it eats',
      ],
    },
  ],
  '5-7': [
    {
      title: 'How Something Works',
      prompt: 'Choose something from nature or something you use (rain cycle, how plants grow, how a bicycle works). Explain how it works.',
      description: 'Explain a process or mechanism',
      instructions: [
        'Introduce the topic clearly',
        'Explain steps or stages in order',
        'Use transition words (first, next, then, finally)',
        'Give helpful examples',
      ],
    },
    {
      title: 'Interesting Facts About a Topic',
      prompt: 'Choose a topic that interests you (space, dinosaurs, ancient Egypt, sports). Write interesting facts you learned.',
      description: 'Share informative facts about a topic',
      instructions: [
        'Introduce your topic',
        'Provide at least 5 interesting facts',
        'Organize facts in a logical way',
        'Use examples to explain facts',
      ],
    },
  ],
  '7-11': [
    {
      title: 'Explain a Historical Event',
      prompt: 'Choose an important historical event. Explain what happened, why it matters, and its effects.',
      description: 'Educate readers about history',
      instructions: [
        'Give background information',
        'Explain what happened in clear sequence',
        'Describe why it was important',
        'Discuss its effects or legacy',
      ],
    },
    {
      title: 'How To: A Detailed Guide',
      prompt: 'Choose a process or skill (cooking a meal, building something, playing a game, learning a skill). Write a detailed how-to guide.',
      description: 'Write instructional guide',
      instructions: [
        'List materials or tools needed',
        'Break process into clear, logical steps',
        'Include helpful tips',
        'Explain what can go wrong and how to fix it',
      ],
    },
  ],
  '11-14': [
    {
      title: 'Researching and Explaining Scientific Concepts',
      prompt: 'Choose a science topic that interests you (how the immune system works, climate change, space exploration, genetics). Write an explanation.',
      description: 'Explain science clearly and accurately',
      instructions: [
        'Define key terms clearly',
        'Explain concepts in logical progression',
        'Use examples and analogies to clarify',
        'Include relevant facts and data',
        'Conclude with broader implications or questions',
      ],
    },
    {
      title: 'Analyzing Causes and Effects',
      prompt: 'Choose a significant event, trend, or phenomenon. Explain its causes and effects.',
      description: 'Explore cause-and-effect relationships',
      instructions: [
        'Clearly state the event or phenomenon',
        'Identify and explain multiple causes',
        'Describe immediate and long-term effects',
        'Analyze how causes and effects connect',
        'Provide examples for each cause and effect',
      ],
    },
  ],
  '14-16': [
    {
      title: 'Synthesizing Complex Information',
      prompt: 'Choose a complex topic (artificial intelligence, sustainable development, cybersecurity). Research and write an informative piece that synthesizes multiple perspectives.',
      description: 'Synthesize complex information clearly',
      instructions: [
        'Provide essential background and context',
        'Explain key concepts with precision and clarity',
        'Present multiple viewpoints or approaches',
        'Integrate research and credible sources',
        'Anticipate and address reader questions',
      ],
    },
    {
      title: 'Problem Analysis and Solutions',
      prompt: 'Identify a real-world problem (local, national, or global). Explain its causes and propose potential solutions.',
      description: 'Analyze problems and propose solutions',
      instructions: [
        'Clearly define and contextualize the problem',
        'Explain underlying causes',
        'Present multiple solution approaches',
        'Evaluate feasibility and effectiveness of each solution',
        'Consider stakeholders and implementation challenges',
      ],
    },
  ],
  '16+': [
    {
      title: 'Interdisciplinary Analysis',
      prompt: 'Choose a contemporary issue and analyze it from multiple disciplinary perspectives (economic, social, environmental, ethical, etc.).',
      description: 'Analyze issues from multiple perspectives',
      instructions: [
        'Define the issue with nuance and complexity',
        'Apply multiple analytical frameworks',
        'Integrate findings from different disciplines',
        'Examine underlying assumptions and values',
        'Propose frameworks for understanding and action',
      ],
    },
    {
      title: 'Evaluating Information and Sources',
      prompt: 'Choose a controversial topic. Research and explain different perspectives. Analyze the quality and credibility of various sources.',
      description: 'Critically evaluate information sources',
      instructions: [
        'Identify the controversial issue clearly',
        'Present multiple credible perspectives fairly',
        'Analyze evidence quality and source credibility',
        'Identify biases, gaps, and limitations',
        'Draw evidence-based conclusions',
      ],
    },
  ],
};

// ==================== POETRY ====================

const POETRY_PROMPTS = {
  '3-5': [
    {
      title: 'Color Poem',
      prompt: 'Choose your favorite color. Write about things that are that color. What words describe that color?',
      description: 'Create a simple sensory poem',
      instructions: [
        'Use rhyming words if you want',
        'Write about things that are your color',
        'Use words that describe feelings or senses',
      ],
    },
    {
      title: 'Animal Poem',
      prompt: 'Write a short poem about an animal. Tell what the animal does and sounds like.',
      description: 'Write a poem about an animal',
      instructions: [
        'Describe the animal',
        'Tell what sounds it makes',
        'Tell what it does',
      ],
    },
  ],
  '5-7': [
    {
      title: 'Acrostic Poem',
      prompt: 'Choose a word (your name, an animal, a season). Write an acrostic poem where each line starts with the letters of your word.',
      description: 'Create an acrostic poem',
      instructions: [
        'Choose a word',
        'Write lines that start with each letter',
        'Make each line relate to your word',
        'Use describing words',
      ],
    },
    {
      title: 'Rhyming Poem',
      prompt: 'Write a rhyming poem about your favorite season. Include things you see, hear, and feel in that season.',
      description: 'Write a rhyming poem about seasons',
      instructions: [
        'Choose a season',
        'Write lines that rhyme',
        'Include sensory details',
        'Write at least 4-8 lines',
      ],
    },
  ],
  '7-11': [
    {
      title: 'Haiku Poetry',
      prompt: 'Write three haikus about nature. Remember: 5 syllables, 7 syllables, 5 syllables. Include vivid sensory details.',
      description: 'Compose haiku poems',
      instructions: [
        'Follow the 5-7-5 syllable pattern',
        'Focus on a moment in nature',
        'Use sensory, concrete words',
        'Capture feeling or mood',
      ],
    },
    {
      title: 'Free Verse Poetry',
      prompt: 'Write a poem without worrying about rhyme or meter. Express an emotion, feeling, or observation in poetic language.',
      description: 'Write free verse poetry',
      instructions: [
        'Use vivid, descriptive language',
        'Use metaphors or similes',
        'Break lines in meaningful ways',
        'Focus on imagery and emotion',
      ],
    },
  ],
  '11-14': [
    {
      title: 'Metaphorical Poetry',
      prompt: 'Write a poem built around an extended metaphor. Compare something abstract (emotion, idea, experience) to something concrete.',
      description: 'Create poetry using metaphor',
      instructions: [
        'Choose an emotion or abstract concept',
        'Develop a consistent metaphor throughout',
        'Use vivid, specific imagery',
        'Show depth and complexity in the comparison',
      ],
    },
    {
      title: 'Reflective Poetry',
      prompt: 'Write a poem that reflects on change, growth, loss, or an important realization. Use poetic devices like imagery, personification, or symbolism.',
      description: 'Write reflective poetry',
      instructions: [
        'Focus on a significant realization or change',
        'Use multiple poetic devices',
        'Create clear imagery',
        'Show emotional depth and insight',
      ],
    },
  ],
  '14-16': [
    {
      title: 'Modernist/Contemporary Poetry',
      prompt: 'Write a poem that experiments with form, structure, or language. Challenge conventional poetry to explore new possibilities.',
      description: 'Explore experimental poetry forms',
      instructions: [
        'Experiment with unconventional structure',
        'Play with language in interesting ways',
        'Use literary devices creatively',
        'Create unique voice and vision',
      ],
    },
    {
      title: 'Socially Conscious Poetry',
      prompt: 'Write a poem that addresses a social issue, injustice, or cultural observation. Use poetic language to create impact.',
      description: 'Write poetry about social issues',
      instructions: [
        'Choose a meaningful social topic',
        'Use precise, powerful language',
        'Employ multiple poetic devices',
        'Create emotional and intellectual engagement',
      ],
    },
  ],
  '16+': [
    {
      title: 'Craft-Focused Poetry',
      prompt: 'Write a poem that demonstrates mastery of poetic form and craft. Consider meter, rhyme, imagery, syntax, and deeper meaning.',
      description: 'Demonstrate poetic craft and mastery',
      instructions: [
        'Choose a specific form (sonnet, villanelle, etc.) or create your own',
        'Demonstrate control of language and structure',
        'Integrate multiple layers of meaning',
        'Use sophisticated poetic devices',
      ],
    },
    {
      title: 'Philosophical or Existential Poetry',
      prompt: 'Write a poem that engages with philosophical questions or existential concerns. Use poetic language to explore meaning, identity, or human experience.',
      description: 'Explore philosophical themes through poetry',
      instructions: [
        'Engage with profound questions or themes',
        'Use language that resonates intellectually and emotionally',
        'Create multiple layers of meaning',
        'Demonstrate poetic sophistication',
      ],
    },
  ],
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive writing types seed...\n');

    // Clear existing prompts
    await db.WritingPrompt.destroy({ where: {} });
    console.log('✅ Cleared existing prompts\n');

    const createdPrompts = [];

    // ==================== SEED CREATIVE WRITING ====================
    console.log('📖 Seeding Creative Writing with Themes...');
    for (const [theme, data] of Object.entries(CREATIVE_THEMES)) {
      for (const ageGroup of AGE_GROUPS) {
        // Rotate through titles
        const titleIndex = createdPrompts.filter(
          (p) => p.theme === theme && p.ageGroup === ageGroup
        ).length;
        const title = data.titles[titleIndex % data.titles.length];

        const prompt = await db.WritingPrompt.create({
          title,
          prompt: data.basePrompt(title, ageGroup),
          description: data.description,
          type: 'creative',
          theme,
          ageGroup,
          difficulty: DIFFICULTY_BY_AGE[ageGroup],
          wordCountMin: WORD_COUNTS_BY_AGE[ageGroup].min,
          wordCountMax: WORD_COUNTS_BY_AGE[ageGroup].max,
          wordCountTarget: WORD_COUNTS_BY_AGE[ageGroup].target,
          timeLimit: TIME_LIMITS_BY_AGE[ageGroup],
          category: 'practice',
          isActive: true,
        });
        createdPrompts.push(prompt);
      }
    }
    console.log(`✅ Created ${createdPrompts.length} creative writing prompts\n`);

    // ==================== SEED PERSUASIVE WRITING ====================
    console.log('🎯 Seeding Persuasive Writing...');
    let persuasiveCount = 0;
    for (const [ageGroup, prompts] of Object.entries(PERSUASIVE_PROMPTS)) {
      for (const promptData of prompts) {
        const prompt = await db.WritingPrompt.create({
          title: promptData.title,
          prompt: promptData.prompt,
          description: promptData.description,
          instructions: promptData.instructions,
          type: 'persuasive',
          theme: null,
          ageGroup,
          difficulty: DIFFICULTY_BY_AGE[ageGroup],
          wordCountMin: WORD_COUNTS_BY_AGE[ageGroup].min,
          wordCountMax: WORD_COUNTS_BY_AGE[ageGroup].max,
          wordCountTarget: WORD_COUNTS_BY_AGE[ageGroup].target,
          timeLimit: TIME_LIMITS_BY_AGE[ageGroup],
          category: 'practice',
          isActive: true,
        });
        createdPrompts.push(prompt);
        persuasiveCount++;
      }
    }
    console.log(`✅ Created ${persuasiveCount} persuasive writing prompts\n`);

    // ==================== SEED DESCRIPTIVE WRITING ====================
    console.log('🎨 Seeding Descriptive Writing...');
    let descriptiveCount = 0;
    for (const [ageGroup, prompts] of Object.entries(DESCRIPTIVE_PROMPTS)) {
      for (const promptData of prompts) {
        const prompt = await db.WritingPrompt.create({
          title: promptData.title,
          prompt: promptData.prompt,
          description: promptData.description,
          instructions: promptData.instructions,
          type: 'descriptive',
          theme: null,
          ageGroup,
          difficulty: DIFFICULTY_BY_AGE[ageGroup],
          wordCountMin: WORD_COUNTS_BY_AGE[ageGroup].min,
          wordCountMax: WORD_COUNTS_BY_AGE[ageGroup].max,
          wordCountTarget: WORD_COUNTS_BY_AGE[ageGroup].target,
          timeLimit: TIME_LIMITS_BY_AGE[ageGroup],
          category: 'practice',
          isActive: true,
        });
        createdPrompts.push(prompt);
        descriptiveCount++;
      }
    }
    console.log(`✅ Created ${descriptiveCount} descriptive writing prompts\n`);

    // ==================== SEED NARRATIVE WRITING ====================
    console.log('📝 Seeding Narrative/Autobiographical Writing...');
    let narrativeCount = 0;
    for (const [ageGroup, prompts] of Object.entries(NARRATIVE_PROMPTS)) {
      for (const promptData of prompts) {
        const prompt = await db.WritingPrompt.create({
          title: promptData.title,
          prompt: promptData.prompt,
          description: promptData.description,
          instructions: promptData.instructions,
          type: 'narrative',
          theme: null,
          ageGroup,
          difficulty: DIFFICULTY_BY_AGE[ageGroup],
          wordCountMin: WORD_COUNTS_BY_AGE[ageGroup].min,
          wordCountMax: WORD_COUNTS_BY_AGE[ageGroup].max,
          wordCountTarget: WORD_COUNTS_BY_AGE[ageGroup].target,
          timeLimit: TIME_LIMITS_BY_AGE[ageGroup],
          category: 'practice',
          isActive: true,
        });
        createdPrompts.push(prompt);
        narrativeCount++;
      }
    }
    console.log(`✅ Created ${narrativeCount} narrative writing prompts\n`);

    // ==================== SEED INFORMATIVE WRITING ====================
    console.log('ℹ️ Seeding Informative/Explanatory Writing...');
    let informativeCount = 0;
    for (const [ageGroup, prompts] of Object.entries(INFORMATIVE_PROMPTS)) {
      for (const promptData of prompts) {
        const prompt = await db.WritingPrompt.create({
          title: promptData.title,
          prompt: promptData.prompt,
          description: promptData.description,
          instructions: promptData.instructions,
          type: 'informative',
          theme: null,
          ageGroup,
          difficulty: DIFFICULTY_BY_AGE[ageGroup],
          wordCountMin: WORD_COUNTS_BY_AGE[ageGroup].min,
          wordCountMax: WORD_COUNTS_BY_AGE[ageGroup].max,
          wordCountTarget: WORD_COUNTS_BY_AGE[ageGroup].target,
          timeLimit: TIME_LIMITS_BY_AGE[ageGroup],
          category: 'practice',
          isActive: true,
        });
        createdPrompts.push(prompt);
        informativeCount++;
      }
    }
    console.log(`✅ Created ${informativeCount} informative writing prompts\n`);

    // ==================== SEED POETRY ====================
    console.log('✨ Seeding Poetry Writing...');
    let poetryCount = 0;
    for (const [ageGroup, prompts] of Object.entries(POETRY_PROMPTS)) {
      for (const promptData of prompts) {
        const prompt = await db.WritingPrompt.create({
          title: promptData.title,
          prompt: promptData.prompt,
          description: promptData.description,
          instructions: promptData.instructions,
          type: 'poems',
          theme: null,
          ageGroup,
          difficulty: DIFFICULTY_BY_AGE[ageGroup],
          wordCountMin: Math.floor(WORD_COUNTS_BY_AGE[ageGroup].min * 0.5),
          wordCountMax: WORD_COUNTS_BY_AGE[ageGroup].max,
          wordCountTarget: Math.floor(WORD_COUNTS_BY_AGE[ageGroup].target * 0.7),
          timeLimit: TIME_LIMITS_BY_AGE[ageGroup],
          category: 'practice',
          isActive: true,
        });
        createdPrompts.push(prompt);
        poetryCount++;
      }
    }
    console.log(`✅ Created ${poetryCount} poetry writing prompts\n`);

    // ==================== VERIFICATION ====================
    console.log('🔍 Verification Report:');
    console.log('=======================');

    const typeStats = {};
    for (const prompt of createdPrompts) {
      if (!typeStats[prompt.type]) {
        typeStats[prompt.type] = 0;
      }
      typeStats[prompt.type]++;
    }

    console.log('\n📊 Prompts by Writing Type:');
    for (const [type, count] of Object.entries(typeStats)) {
      console.log(`   ${type}: ${count} prompts`);
    }

    console.log('\n📈 Coverage Report:');
    const types = ['creative', 'persuasive', 'descriptive', 'narrative', 'informative', 'poems'];
    for (const type of types) {
      const ageGroupCoverage = new Set();
      for (const prompt of createdPrompts) {
        if (prompt.type === type) {
          ageGroupCoverage.add(prompt.ageGroup);
        }
      }
      const coverage = ageGroupCoverage.size === 6 ? '✅' : '❌';
      console.log(`   ${type}: ${Array.from(ageGroupCoverage).sort()} ${coverage}`);
    }

    console.log('\n✅ Total prompts created:', createdPrompts.length);
    console.log('✅ Seeding completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
