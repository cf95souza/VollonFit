import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf8')
const lines = envContent.split('\n')

const getVal = (key) => {
    const line = lines.find(l => l.includes(key) && !l.startsWith('#'))
    return line ? line.split('=')[1].replace(/"/g, '').trim() : null
}

const NEW_URL = getVal('VITE_SUPABASE_URL')
const NEW_KEY = getVal('VITE_SUPABASE_ANON_KEY')

const supabase = createClient(NEW_URL, NEW_KEY)

async function listPolicies() {
    console.log('🕵️ Investigando políticas de segurança (RLS)...')

    // No Supabase, podemos consultar a view pg_policies via RPC ou SQL
    // Como não temos um RPC pronto, vamos tentar buscar informações de uma forma que revele se o RLS está ativo
    
    const tables = ['gym_students', 'gym_exercises', 'gym_workouts', 'gym_teachers']
    
    for (const table of tables) {
        console.log(`\n--- Tabela: ${table} ---`)
        
        // Tentar um SELECT simples para ver se o erro de RLS aparece ou o que retorna
        const { data, error, status } = await supabase.from(table).select('*').limit(1)
        
        if (error) {
            console.log(`❌ Erro no SELECT: ${error.message} (Código: ${error.code})`)
        } else {
            console.log(`✅ SELECT bem-sucedido. Retornou ${data.length} registros.`)
        }
    }

    console.log('\n💡 Como eu não consigo ler a tabela de sistema pg_policies diretamente via API Anon, peço que você execute o comando abaixo no seu SQL Editor do Supabase:')
    console.log(`
    SELECT 
        schemaname, 
        tablename, 
        policyname, 
        permissive, 
        roles, 
        cmd, 
        qual, 
        with_check 
    FROM pg_policies 
    WHERE tablename LIKE 'gym_%';
    `)
}

listPolicies()
