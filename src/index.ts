import Fastify from 'fastify';
import { getJudgeResult } from './services/judge';
import { getGladiatorResult } from './services/gladiator';

const fastify = Fastify({ logger: true });

fastify.get('/', async (request, reply) => {
  return { message: 'Hello, Fastify with TypeScript!' };
});


fastify.post('/gladiator', async (request, reply) => {
  const response = await getGladiatorResult(request.body as any)
  return response;
});


fastify.post('/judge', async (request, reply) => {
  const response = await getJudgeResult(request.body as any)
  return response;
});

const start = async () => {
  try {
    await fastify.listen({ port: 3008 });
    console.log('🚀 Server running on http://localhost:3008');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
