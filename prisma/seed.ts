/**
 * Database Seed Script
 * Populates database with default personas and sample data
 */

import { PrismaClient, PersonaRole } from '../generated/prisma';
import { DEFAULT_PERSONAS, getAllDefaultPersonas } from '../services/defaultPersonas';

const prisma = new PrismaClient();

/**
 * Seed default personas
 */
async function seedDefaultPersonas() {
  console.log('🎭 Seeding default personas...\n');

  const defaultPersonas = getAllDefaultPersonas();
  const createdPersonas: any[] = [];

  for (const defaultPersona of defaultPersonas) {
    // Check if persona already exists
    const existing = await prisma.persona.findUnique({
      where: { name: defaultPersona.name },
    });

    if (existing) {
      console.log(`  ⏭️  ${defaultPersona.name} already exists (skipping)`);
      createdPersonas.push(existing);
      continue;
    }

    // Create new persona
    const persona = await prisma.persona.create({
      data: {
        name: defaultPersona.name,
        role: defaultPersona.role as PersonaRole,
        bio: defaultPersona.bio,
        expertise: defaultPersona.expertise,
        formality: defaultPersona.formality,
        enthusiasm: defaultPersona.enthusiasm,
        humor: defaultPersona.humor,
        expertiseLevel: defaultPersona.expertiseLevel,
        interruption: defaultPersona.interruption,
        sentenceLength: defaultPersona.sentenceLength,
        vocabulary: defaultPersona.vocabulary,
        expressiveness: defaultPersona.expressiveness,
        pace: defaultPersona.pace,
        // Default voice settings (can be customized later)
        voiceProvider: 'ELEVENLABS',
        voiceId: `${defaultPersona.name.toLowerCase().replace(/\s+/g, '-')}-voice`,
        voiceStability: 0.7,
        voiceSimilarity: 0.8,
      },
    });

    console.log(`  ✓ Created ${persona.name} (${persona.role}) - ${defaultPersona.description}`);
    createdPersonas.push(persona);
  }

  console.log(`\n✅ Default personas seeded: ${createdPersonas.length}/${defaultPersonas.length}\n`);
  return createdPersonas;
}

/**
 * Seed sample content and podcast (for testing/demo)
 */
async function seedSampleContent(personas: any[]) {
  console.log('📄 Seeding sample content...\n');

  // Get default personas for the sample podcast (Sarah + Marcus)
  const sarah = personas.find((p) => p.name === 'Sarah Chen');
  const marcus = personas.find((p) => p.name === 'Marcus Thompson');
  const emily = personas.find((p) => p.name === 'Dr. Emily Rivera');

  if (!sarah || !marcus || !emily) {
    console.log('⚠️  Default personas not found, skipping sample content');
    return;
  }

  // Check if sample content already exists
  const existingContent = await prisma.content.findFirst({
    where: { title: 'The History and Impact of Artificial Intelligence' },
  });

  if (existingContent) {
    console.log('⏭️  Sample content already exists (skipping)\n');
    return;
  }

  // Create Sample Content
  const content = await prisma.content.create({
    data: {
      title: 'The History and Impact of Artificial Intelligence',
      sourceType: 'TEXT',
      rawText: `
        Artificial Intelligence (AI) has evolved from a theoretical concept to one of the most
        transformative technologies of our time. The field began in 1956 at the Dartmouth Conference,
        where John McCarthy coined the term "artificial intelligence."

        Early AI research focused on symbolic reasoning and problem-solving. Researchers like Allen
        Newell and Herbert Simon developed the Logic Theorist, one of the first AI programs. The field
        experienced several "AI winters" - periods of reduced funding and interest - but continued to
        advance through the dedication of researchers worldwide.

        Modern AI leverages machine learning, particularly deep learning neural networks, to achieve
        remarkable results in image recognition, natural language processing, and game playing. The
        2012 ImageNet competition marked a turning point when deep learning dramatically outperformed
        traditional computer vision approaches.

        Today, AI powers virtual assistants, recommendation systems, autonomous vehicles, and medical
        diagnosis tools. Large language models like GPT-4 demonstrate unprecedented capabilities in
        understanding and generating human-like text. However, these advances also raise important
        questions about ethics, bias, transparency, and the future of work.

        As AI continues to evolve, researchers are exploring artificial general intelligence (AGI) -
        systems that can match or exceed human intelligence across all cognitive tasks. While AGI
        remains theoretical, its potential impact on society makes it crucial to develop AI responsibly
        and ensure its benefits are widely distributed.
      `,
      wordCount: 250,
      author: 'Dr. Jane Smith',
      sourceUrl: 'https://example.com/ai-history',
    },
  });

  console.log(`✓ Created content: "${content.title}"`);

  // Create Facts from Content
  const facts = await prisma.fact.createMany({
    data: [
      {
        contentId: content.id,
        text: 'The field of AI began in 1956 at the Dartmouth Conference where John McCarthy coined the term "artificial intelligence"',
        importance: 0.9,
        category: 'History',
        section: 'Introduction',
      },
      {
        contentId: content.id,
        text: 'Allen Newell and Herbert Simon developed the Logic Theorist, one of the first AI programs',
        importance: 0.7,
        category: 'History',
        section: 'Early Research',
      },
      {
        contentId: content.id,
        text: 'AI experienced several "AI winters" - periods of reduced funding and interest',
        importance: 0.8,
        category: 'History',
        section: 'Challenges',
      },
      {
        contentId: content.id,
        text: 'The 2012 ImageNet competition marked a turning point when deep learning outperformed traditional approaches',
        importance: 0.9,
        category: 'Modern AI',
        section: 'Deep Learning Revolution',
      },
      {
        contentId: content.id,
        text: 'Modern AI powers virtual assistants, recommendation systems, autonomous vehicles, and medical diagnosis tools',
        importance: 0.8,
        category: 'Applications',
        section: 'Current Applications',
      },
      {
        contentId: content.id,
        text: 'Large language models like GPT-4 demonstrate unprecedented capabilities in understanding and generating human-like text',
        importance: 0.9,
        category: 'Modern AI',
        section: 'Language Models',
      },
      {
        contentId: content.id,
        text: 'AI advances raise important questions about ethics, bias, transparency, and the future of work',
        importance: 0.9,
        category: 'Ethics',
        section: 'Challenges',
      },
      {
        contentId: content.id,
        text: 'Artificial General Intelligence (AGI) refers to systems that can match or exceed human intelligence across all cognitive tasks',
        importance: 0.8,
        category: 'Future',
        section: 'AGI',
      },
    ],
  });

  console.log(`✓ Created ${facts.count} facts`);

  // Create Podcast
  const podcast = await prisma.podcast.create({
    data: {
      title: 'The AI Revolution: Past, Present, and Future',
      contentId: content.id,
      style: 'CONVERSATIONAL',
      targetLength: 30,
      status: 'COMPLETED',
      includeIntro: true,
      includeOutro: true,
      totalWords: 2500,
      estimatedDuration: 1800, // 30 minutes in seconds
      progress: 100,
      currentStep: 'Audio synthesis completed',
      completedAt: new Date(),
    },
  });

  console.log(`✓ Created podcast: "${podcast.title}"`);

  // Associate Personas with Podcast (using default personas)
  await prisma.podcastPersona.createMany({
    data: [
      {
        podcastId: podcast.id,
        personaId: sarah.id,
        turnCount: 12,
        wordCount: 1200,
        percentage: 48.0,
      },
      {
        podcastId: podcast.id,
        personaId: marcus.id,
        turnCount: 8,
        wordCount: 800,
        percentage: 32.0,
      },
      {
        podcastId: podcast.id,
        personaId: emily.id,
        turnCount: 5,
        wordCount: 500,
        percentage: 20.0,
      },
    ],
  });

  console.log('✓ Associated personas with podcast');

  // Create Sample Dialogues
  const dialogues = [
    {
      podcastId: podcast.id,
      personaId: sarah.id,
      turnNumber: 1,
      text: 'Welcome to another episode! Today we\'re diving into the fascinating history and impact of artificial intelligence. I\'m joined by Marcus and Dr. Emily Rivera to explore this transformative technology.',
      timestamp: 0,
      emotions: ['enthusiastic', 'welcoming'],
    },
    {
      podcastId: podcast.id,
      personaId: marcus.id,
      turnNumber: 2,
      text: 'Thanks Sarah! AI is such a rich topic with so much history. When did it all really begin?',
      timestamp: 15000,
      emotions: ['curious', 'engaged'],
    },
    {
      podcastId: podcast.id,
      personaId: emily.id,
      turnNumber: 3,
      text: 'Great question. The field officially started in 1956 at the Dartmouth Conference, where John McCarthy coined the term "artificial intelligence." But the theoretical foundations were laid much earlier.',
      timestamp: 22000,
      emotions: ['thoughtful', 'informative'],
    },
    {
      podcastId: podcast.id,
      personaId: sarah.id,
      turnNumber: 4,
      text: 'What were researchers working on back then? It must have been very different from today\'s AI!',
      timestamp: 38000,
      emotions: ['curious', 'enthusiastic'],
    },
    {
      podcastId: podcast.id,
      personaId: emily.id,
      turnNumber: 5,
      text: 'Absolutely. Early AI focused on symbolic reasoning and problem-solving. Allen Newell and Herbert Simon developed the Logic Theorist, one of the first AI programs. It could prove mathematical theorems - quite revolutionary for its time.',
      timestamp: 45000,
      emotions: ['informative', 'analytical'],
    },
    {
      podcastId: podcast.id,
      personaId: marcus.id,
      turnNumber: 6,
      text: 'I\'ve heard about "AI winters" - what were those about?',
      timestamp: 65000,
      emotions: ['curious', 'thoughtful'],
    },
    {
      podcastId: podcast.id,
      personaId: emily.id,
      turnNumber: 7,
      text: 'AI winters were periods when progress slowed and funding dried up. Expectations had been set too high, and when systems couldn\'t deliver, investors and governments pulled back. But researchers persevered.',
      timestamp: 72000,
      emotions: ['serious', 'historical'],
    },
    {
      podcastId: podcast.id,
      personaId: sarah.id,
      turnNumber: 8,
      text: 'Fast forward to today - what changed? How did we go from AI winters to the AI revolution we\'re seeing now?',
      timestamp: 90000,
      emotions: ['enthusiastic', 'curious'],
    },
  ];

  for (const dialogue of dialogues) {
    await prisma.dialogue.create({ data: dialogue });
  }

  console.log(`✓ Created ${dialogues.length} dialogue turns`);

  // Create Processing Job Example
  const job = await prisma.processingJob.create({
    data: {
      jobType: 'dialogue_generation',
      podcastId: podcast.id,
      status: 'COMPLETED',
      progress: 100,
      inputData: JSON.stringify({ factCount: facts.count }),
      outputData: JSON.stringify({ dialogueCount: dialogues.length }),
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      completedAt: new Date(),
    },
  });

  console.log(`✓ Created processing job: ${job.jobType}`);

  console.log('\n✅ Sample content seeded successfully!\n');
}

/**
 * Main seeding function
 */
async function main() {
  console.log('🌱 Starting database seed...\n');
  console.log('=' .repeat(60));
  console.log('SCRIBEPOD - Default Personas & Sample Data Seeder');
  console.log('=' .repeat(60) + '\n');

  try {
    // Seed default personas (8 curated personas)
    const personas = await seedDefaultPersonas();

    // Seed sample content and podcast for demo/testing
    await seedSampleContent(personas);

    console.log('=' .repeat(60));
    console.log('✅ Database seeding completed successfully!');
    console.log('=' .repeat(60) + '\n');

    console.log('Summary:');
    console.log(`  ✓ ${personas.length} Default personas`);
    console.log('  ✓ Sample content (AI History)');
    console.log('  ✓ Sample podcast with dialogues');
    console.log('  ✓ Processing job example\n');

    console.log('Default Personas:');
    personas.forEach((p) => {
      const defaultData = DEFAULT_PERSONAS[Object.keys(DEFAULT_PERSONAS).find(
        key => DEFAULT_PERSONAS[key].name === p.name
      )!];
      if (defaultData) {
        console.log(`  • ${p.name} (${p.role}) - ${defaultData.description}`);
      }
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during seeding:');
    throw error;
  }
}

// Execute seeding
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
