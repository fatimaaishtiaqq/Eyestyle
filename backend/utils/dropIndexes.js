import mongoose from 'mongoose';

export const dropLegacyIndexes = async () => {
    try {
        const db = mongoose.connection.db;
        const coll = db.collection('categories');

        console.log('--- Checking legacy indexes ---');
        try {
            await coll.dropIndex('name_1');
            console.log('✓ Dropped legacy name_1 index');
        } catch (e) {
            if (e.codeName !== 'IndexNotFound') console.log('name_1 error:', e.message);
            else console.log('✓ name_1 already dropped');
        }

        try {
            await coll.dropIndex('slug_1');
            console.log('✓ Dropped legacy slug_1 index');
        } catch (e) {
            if (e.codeName !== 'IndexNotFound') console.log('slug_1 error:', e.message);
            else console.log('✓ slug_1 already dropped');
        }
    } catch (e) {
        console.error('Failed to drop indexes:', e.message);
    }
};
