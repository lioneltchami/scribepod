/**
 * Database Seed Script
 * Populates database with sample data for development and testing
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (optional - comment out if you want to preserve data)
  console.log('Cleaning existing data...');
  await prisma.audioSegment.deleteMany();
  await prisma.dialogue.deleteMany();
  await prisma.podcastPersona.deleteMany();
  await prisma.podcast.deleteMany();
  await prisma.fact.deleteMany();
  await prisma.content.deleteMany();
  await prisma.persona.deleteMany();
  await prisma.processingJob.deleteMany();
  console.log('✓ Cleaned existing data\n');

  // Create Personas
  console.log('Creating personas...');

  const alice = await prisma.persona.create({
    data: {
      name: 'Alice',
      role: 'HOST',
      bio: 'Alice is an experienced podcast host with a background in science communication. She has a talent for making complex topics accessible to general audiences while maintaining intellectual rigor.',
      expertise: ['Science Communication', 'Interviewing', 'Education', 'Technology'],
      formality: 0.6,
      enthusiasm: 0.8,
      humor: 0.7,
      expertiseLevel: 0.8,
      interruption: 0.2,
      sentenceLength: 'medium',
      vocabulary: 'academic',
      expressiveness: 'varied',
      pace: 'medium',
      voiceProvider: 'ELEVENLABS',
      voiceId: 'alice-voice-id',
      voiceStability: 0.7,
      voiceSimilarity: 0.8,
    },
  });

  const bob = await prisma.persona.create({
    data: {
      name: 'Bob',
      role: 'GUEST',
      bio: 'Bob is a curious learner who asks insightful questions. He represents the intelligent layperson audience, helping to draw out explanations and clarifications that benefit all listeners.',
      expertise: ['Critical Thinking', 'Philosophy', 'History', 'General Knowledge'],
      formality: 0.5,
      enthusiasm: 0.7,
      humor: 0.6,
      expertiseLevel: 0.6,
      interruption: 0.4,
      sentenceLength: 'short',
      vocabulary: 'simple',
      expressiveness: 'varied',
      pace: 'medium',
      voiceProvider: 'ELEVENLABS',
      voiceId: 'bob-voice-id',
      voiceStability: 0.6,
      voiceSimilarity: 0.75,
    },
  });

  const carol = await prisma.persona.create({
    data: {
      name: 'Carol',
      role: 'GUEST',
      bio: 'Carol is a technical expert who brings deep domain knowledge. She can dive into technical details when appropriate but is skilled at explaining complex concepts clearly.',
      expertise: ['Computer Science', 'AI/ML', 'Mathematics', 'Research'],
      formality: 0.7,
      enthusiasm: 0.6,
      humor: 0.4,
      expertiseLevel: 0.9,
      interruption: 0.3,
      sentenceLength: 'long',
      vocabulary: 'technical',
      expressiveness: 'monotone',
      pace: 'slow',
      voiceProvider: 'PLAYHT',
      voiceId: 'carol-voice-id',
      voiceStability: 0.8,
      voiceSimilarity: 0.7,
    },
  });

  console.log(`✓ Created ${alice.name} (${alice.role})`);
  console.log(`✓ Created ${bob.name} (${bob.role})`);
  console.log(`✓ Created ${carol.name} (${carol.role})\n`);

  // Create Sample Content
  console.log('Creating sample content...');

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

  console.log(`✓ Created content: "${content.title}"\n`);

  // Create Facts from Content
  console.log('Creating facts...');

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

  console.log(`✓ Created ${facts.count} facts\n`);

  // Create Podcast
  console.log('Creating podcast...');

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

  console.log(`✓ Created podcast: "${podcast.title}"\n`);

  // Associate Personas with Podcast
  console.log('Associating personas with podcast...');

  await prisma.podcastPersona.createMany({
    data: [
      {
        podcastId: podcast.id,
        personaId: alice.id,
        turnCount: 12,
        wordCount: 1200,
        percentage: 48.0,
      },
      {
        podcastId: podcast.id,
        personaId: bob.id,
        turnCount: 8,
        wordCount: 800,
        percentage: 32.0,
      },
      {
        podcastId: podcast.id,
        personaId: carol.id,
        turnCount: 5,
        wordCount: 500,
        percentage: 20.0,
      },
    ],
  });

  console.log('✓ Associated all personas with podcast\n');

  // Create Sample Dialogues
  console.log('Creating sample dialogues...');

  const dialogues = [
    {
      podcastId: podcast.id,
      personaId: alice.id,
      turnNumber: 1,
      text: 'Welcome to another episode! Today we\'re diving into the fascinating history and impact of artificial intelligence. I\'m joined by Bob and Carol to explore this transformative technology.',
      timestamp: 0,
      emotions: ['enthusiastic', 'welcoming'],
    },
    {
      podcastId: podcast.id,
      personaId: bob.id,
      turnNumber: 2,
      text: 'Thanks Alice! I\'ve always been curious about AI. When did it all really begin?',
      timestamp: 15000,
      emotions: ['curious', 'engaged'],
    },
    {
      podcastId: podcast.id,
      personaId: carol.id,
      turnNumber: 3,
      text: 'Great question. The field officially started in 1956 at the Dartmouth Conference, where John McCarthy coined the term "artificial intelligence." But the seeds were planted much earlier.',
      timestamp: 22000,
      emotions: ['thoughtful', 'informative'],
    },
    {
      podcastId: podcast.id,
      personaId: alice.id,
      turnNumber: 4,
      text: 'What were researchers working on back then? It must have been very different from today\'s AI.',
      timestamp: 38000,
      emotions: ['curious', 'analytical'],
    },
    {
      podcastId: podcast.id,
      personaId: carol.id,
      turnNumber: 5,
      text: 'Absolutely. Early AI focused on symbolic reasoning and problem-solving. Allen Newell and Herbert Simon developed the Logic Theorist, one of the first AI programs. It was quite revolutionary for its time.',
      timestamp: 45000,
      emotions: ['informative', 'historical'],
    },
  ];

  for (const dialogue of dialogues) {
    await prisma.dialogue.create({ data: dialogue });
  }

  console.log(`✓ Created ${dialogues.length} dialogue turns\n`);

  // Create Processing Job Example
  console.log('Creating sample processing job...');

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

  console.log(`✓ Created processing job: ${job.jobType}\n`);

  console.log('✅ Database seeding completed successfully!');
  console.log('\nCreated:');
  console.log(`  - 3 Personas (${alice.name}, ${bob.name}, ${carol.name})`);
  console.log(`  - 1 Content (${content.title})`);
  console.log(`  - ${facts.count} Facts`);
  console.log(`  - 1 Podcast (${podcast.title})`);
  console.log(`  - ${dialogues.length} Dialogue turns`);
  console.log(`  - 1 Processing job\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
