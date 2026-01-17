// Quick Sales Clear Script - Run this NOW
// Usage: node clear_sales_quick.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearSalesForResync() {
    try {
        console.log('🔄 Starting sales data cleanup...\n');

        // Count before
        const countBefore = await prisma.sale.count();
        console.log(`📊 Current sales records: ${countBefore}`);

        // Delete all
        console.log('\n🗑️  Deleting all sales...');
        const result = await prisma.sale.deleteMany({});
        console.log(`✅ Deleted: ${result.count} records`);

        // Verify
        const countAfter = await prisma.sale.count();
        console.log(`\n📊 Remaining sales records: ${countAfter}`);

        if (countAfter === 0) {
            console.log('\n✅ SUCCESS! Database cleared. Ready for re-sync.');
            console.log('\n📋 NEXT STEP: Tell client to restart connector service on their machine:');
            console.log('   Stop-Service -Name "PlannerConnector"');
            console.log('   Remove-Item -Path "C:\\ProgramData\\PlannerConnector\\sync_state.json" -Force');
            console.log('   Start-Service -Name "PlannerConnector"');
        } else {
            console.log('\n⚠️  WARNING: Some records remain! Check database.');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

clearSalesForResync();
