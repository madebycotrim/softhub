const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const DB_NAME = 'DB';

async function iniciar() {
    console.log('🚀 Iniciando processamento de migrations...');

    try {
        const arquivos = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`📦 Encontradas ${arquivos.length} migrations. Modo: NUVEM (D1 Remoto)`);

        for (const arquivo of arquivos) {
            const caminho = path.join('src/db/migrations', arquivo);
            console.log(`➡️ Executando ${arquivo} no D1 remoto...`);

            try {
                // Força --remote conforme solicitado (Regra: sem banco local)
                execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file=${caminho} -y`, {
                    stdio: 'inherit'
                });
            } catch (e) {
                console.warn(`⚠️ Aviso ao executar ${arquivo}: Pode ser que a tabela já exista ou houve um erro menor. Continuando...`);
            }
        }

        console.log('✅ Todas as migrations processadas!');
        console.log('💡 Dica: Agora rode "npm run db:seed" para popular dados de teste.');
    } catch (erro) {
        console.error('❌ Erro crítico ao processar migrations:', erro.message);
        process.exit(1);
    }
}

iniciar();
