
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// This will use the project ID and credentials from the Firebase CLI's
// currently authenticated user. This is the correct way to do it for a server script.
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'gesmanager-cloundfs',
});

const db = admin.firestore();

const seedMenu = async () => {
  try {
    const menuDataPath = path.join(path.resolve(), 'scripts', 'data', 'menu.json');
    const menuData = JSON.parse(fs.readFileSync(menuDataPath, 'utf8'));
    const menuCollection = db.collection('menu');

    console.log('Starting to seed menu data with Admin SDK...');

    const batch = db.batch();

    for (const menuItem of menuData) {
      const docRef = menuCollection.doc(menuItem.id);
      batch.set(docRef, menuItem);
    }

    await batch.commit();

    console.log('-------------------------------------');
    console.log('Menu data seeding completed successfully!');
    console.log('-------------------------------------');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding menu data:', error);
    process.exit(1);
  }
};

seedMenu();

