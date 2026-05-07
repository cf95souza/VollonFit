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

async function checkIds() {
    console.log('🔍 Comparando IDs de Professor...')

    // 1. Pegar o professor que está no banco
    const { data: teachers } = await supabase.from('gym_teachers').select('id, email')
    console.log('\n👨‍🏫 Professor(es) no banco:')
    console.table(teachers)

    const dbTeacherId = teachers[0]?.id

    // 2. Pegar um aluno e ver o teacher_id dele
    const { data: students } = await supabase.from('gym_students').select('name, teacher_id').limit(1)
    console.log('\n👥 Aluno no banco e seu teacher_id:')
    console.table(students)

    const studentTeacherId = students[0]?.teacher_id

    if (dbTeacherId === studentTeacherId) {
        console.log('\n✅ Os IDs coincidem perfeitamente no banco de dados.')
    } else {
        console.log('\n❌ DESALINHADO: O ID do professor no banco é diferente do ID gravado no aluno.')
    }
}

checkIds()
