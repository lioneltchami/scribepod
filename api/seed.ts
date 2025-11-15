/**
 * One-time seed endpoint for Vercel deployment
 * Visit /api/seed to populate default personas
 */

import { PrismaClient, PersonaRole } from '../generated/prisma';
import { getAllDefaultPersonas } from '../services/defaultPersonas';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    // Check if already seeded
    const existingPersonas = await prisma.persona.count();

    if (existingPersonas >= 8) {
      return res.json({
        success: true,
        message: 'Database already seeded',
        personaCount: existingPersonas
      });
    }

    // Seed default personas
    const defaultPersonas = getAllDefaultPersonas();
    const created = [];

    for (const persona of defaultPersonas) {
      const existing = await prisma.persona.findUnique({
        where: { name: persona.name }
      });

      if (!existing) {
        const newPersona = await prisma.persona.create({
          data: {
            name: persona.name,
            role: persona.role as PersonaRole,
            bio: persona.bio,
            expertise: persona.expertise,
            formality: persona.formality,
            enthusiasm: persona.enthusiasm,
            humor: persona.humor,
            expertiseLevel: persona.expertiseLevel,
            interruption: persona.interruption,
            sentenceLength: persona.sentenceLength,
            vocabulary: persona.vocabulary,
            expressiveness: persona.expressiveness,
            pace: persona.pace,
            voiceProvider: 'ELEVENLABS',
            voiceId: `${persona.name.toLowerCase().replace(/\s+/g, '-')}-voice`,
            voiceStability: 0.7,
            voiceSimilarity: 0.8,
          }
        });
        created.push(newPersona.name);
      }
    }

    res.json({
      success: true,
      message: 'Database seeded successfully',
      created: created,
      total: created.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Seeding failed'
    });
  } finally {
    await prisma.$disconnect();
  }
}
