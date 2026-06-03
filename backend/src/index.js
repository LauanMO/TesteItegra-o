import { config } from './config.js';
import { initSchema } from './db/schema.js';
import { runSeed } from './db/seed.js';
import { createApp } from './app.js';

// Prepara o banco: cria o schema e popula o HSK 1 na primeira execução.
initSchema();
runSeed();

const app = createApp();
app.listen(config.port, () => {
  console.log(`🀄 MandaRim backend rodando em http://localhost:${config.port}`);
  if (!config.iaServiceUrl) {
    console.log('ℹ️  IA_SERVICE_URL não definido — exercícios usarão o gerador local (fallback).');
  }
});
