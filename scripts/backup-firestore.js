import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Determinar la ruta del Service Account
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error("No se encontró el archivo de credenciales en:", serviceAccountPath);
  process.exit(1);
}

// Inicializar Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backup() {
  const data = {};
  
  // Extraer todas las colecciones raíz dinámicamente
  const collections = await db.listCollections();
  
  for (const collection of collections) {
    const snapshot = await collection.get();
    data[collection.id] = {};
    snapshot.forEach(doc => {
      data[collection.id][doc.id] = doc.data();
    });
  }

  // Determinar la hora local de Guatemala (UTC-6)
  const now = new Date();
  const gtTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
  
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const dayName = days[gtTime.getDay()];
  
  // Comprobar si hoy es el último día del mes
  const tomorrow = new Date(gtTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isLastDayOfMonth = tomorrow.getMonth() !== gtTime.getMonth();
  
  const year = gtTime.getFullYear();
  const month = String(gtTime.getMonth() + 1).padStart(2, '0');
  
  // Nombres de archivos
  const fileNameDaily = `${dayName}.json`; // Se sobreescribirá cada semana
  const backupsDir = path.join(process.cwd(), 'backups');
  
  // Asegurar que la carpeta existe
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Escribir el backup diario (rotativo de 7 días)
  fs.writeFileSync(path.join(backupsDir, fileNameDaily), JSON.stringify(data, null, 2));
  console.log(`✅ Backup diario guardado como: ${fileNameDaily}`);

  // Escribir el backup de fin de mes (permanente)
  if (isLastDayOfMonth) {
    const monthlyDir = path.join(backupsDir, 'mensuales');
    if (!fs.existsSync(monthlyDir)) {
      fs.mkdirSync(monthlyDir, { recursive: true });
    }
    const monthlyFileName = `${year}_${month}_fin_de_mes.json`;
    fs.writeFileSync(path.join(monthlyDir, monthlyFileName), JSON.stringify(data, null, 2));
    console.log(`🎯 Backup de fin de mes guardado como: ${monthlyFileName}`);
  }
}

backup().then(() => {
  console.log("Proceso de backup completado exitosamente.");
  process.exit(0);
}).catch(err => {
  console.error("Error durante el backup:", err);
  process.exit(1);
});
