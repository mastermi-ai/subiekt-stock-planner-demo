const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔴 KRYTYCZNE: Ta operacja USUNIE WSZYSTKIE DANE z bazy PostgreSQL!');
console.log('Skopiuj "External Database URL" z panelu Render i wklej go poniżej.');
console.log('');

rl.question('Wklej External Database URL: ', (url) => {
    if (!url || !url.startsWith('postgres')) {
        console.error('❌ Błąd: To nie wygląda jak poprawny URL bazy danych (powinien zaczynać się od postgres://)');
        rl.close();
        return;
    }

    console.log('\n⏳ Rozpoczynam czyszczenie bazy (WIPE)...');
    console.log('Wykonywanie: npx prisma db push --force-reset');

    const command = `npx prisma db push --force-reset`;

    // Execute with the provided DATABASE_URL environment variable
    const child = exec(command, {
        env: { ...process.env, DATABASE_URL: url.trim() }
    });

    child.stdout.on('data', (data) => console.log(data.toString()));
    child.stderr.on('data', (data) => console.error(data.toString()));

    child.on('close', (code) => {
        if (code === 0) {
            console.log('✅ SUKCES! Baza została wyczyszczona.');
        } else {
            console.log(`❌ Błąd: Proces zakończył się kodem ${code}`);
        }
        rl.close();
    });
});
