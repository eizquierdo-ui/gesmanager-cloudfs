const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK with the explicit Project ID
try {
  admin.initializeApp({
    projectId: 'gesmanager-cloundfs',
  });
} catch (e) {
  if (!/already exists/.test(e.message)) {
    console.error('Firebase initialization error:', e.message);
    process.exit(1);
  }
}

const db = admin.firestore();

/**
 * Updates the 'icon' field for each document in the 'menu' collection
 * based on the data from a local JSON file.
 */
async function updateMenuIcons() {
  const jsonFilePath = path.join(__dirname, '..', 'menu-export.json');

  if (!fs.existsSync(jsonFilePath)) {
    console.error(`Error: JSON file not found at ${jsonFilePath}`);
    console.error('Please run "node scripts/extract-menu.cjs" first to generate the file.');
    return;
  }

  const menuData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

  if (!Array.isArray(menuData) || menuData.length === 0) {
    console.error('Error: The JSON file is empty or not a valid array.');
    return;
  }

  console.log(`Found ${menuData.length} items in ${path.basename(jsonFilePath)}.`);
  console.log('Starting to update icons in Firestore...');

  const batch = db.batch();
  let successfulUpdates = 0;

  menuData.forEach(item => {
    // Ensure the item has an ID and an icon value
    if (item.id && typeof item.icon !== 'undefined') {
      const docRef = db.collection('menu').doc(item.id);
      // Update only the 'icon' field
      batch.update(docRef, { icon: item.icon });
      successfulUpdates++;
    }
  });

  if (successfulUpdates === 0) {
    console.warn('No valid items with an 'id' and 'icon' field were found to update.');
    return;
  }

  try {
    await batch.commit();
    console.log(`✅ Success! The 'icon' field for ${successfulUpdates} documents in the 'menu' collection has been updated.`);
    console.log('To change an icon, edit the "icon" value in menu-export.json and run this script again.');
  } catch (error) {
    console.error('Error committing batch update:', error);
  }
}

updateMenuIcons();
