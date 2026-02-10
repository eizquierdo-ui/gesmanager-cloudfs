const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK with the explicit Project ID for clarity and safety
try {
  admin.initializeApp({
    projectId: 'gesmanager-cloundfs',
  });
} catch (e) {
  if (!/already exists/.test(e.message)) {
    console.error('Error initializing Admin SDK:', e);
    process.exit(1);
  } 
}

const db = admin.firestore();

async function exportMenuCollection() {
  console.log('Starting export of \'menu\' collection...');

  const menuCollectionRef = db.collection('menu');
  const snapshot = await menuCollectionRef.get();

  if (snapshot.empty) {
    console.log('No documents found in \'menu\' collection.');
    return;
  }

  const menuData = [];
  snapshot.forEach(doc => {
    menuData.push({
      id: doc.id,
      ...doc.data() // Unwrapping the data object for a cleaner structure
    });
  });

  const outputPath = 'menu-export.json';
  // Using JSON.stringify with a replacer to keep a consistent order
  const orderedData = menuData.sort((a, b) => a.orden - b.orden);
  fs.writeFileSync(outputPath, JSON.stringify(orderedData, ['id', 'label', 'padre_id', 'es_fija', 'orden', 'icon'], 2));

  console.log(`✅ Export successful! All ${menuData.length} documents from \'menu\' have been saved to ${outputPath}`);
}

exportMenuCollection().catch(console.error);
