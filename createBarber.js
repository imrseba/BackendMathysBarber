const { MongoClient, ObjectId } = require('mongodb');

// Cambia esto por tu URI de MongoDB Atlas o local
const uri = 'mongodb+srv://iMrSeba:20.De.Septiembre@barberiamathysbarber.jjcdc.mongodb.net/BarberiaMathysBarber?retryWrites=true&w=majority&appName=BarberiaMathysBarber'; // o 'mongodb+srv://<user>:<pass>@cluster.mongodb.net'
const dbName = 'BarberiaMathysBarber'; // Cambia esto al nombre real de tu base de datos

async function createBarber() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db(dbName);
    const barbersCollection = db.collection('barbers');

    // ID del user ya existente
    const userId = new ObjectId("6813c932c47457cf321556de");

    const newBarber = {
      user_id: userId,
      name: "Hector The Cut",
      specialties: ["Corte clásico", "Barba", "Fade"],
      bio: "Experto en cortes urbanos.",
      schedule: {},
      createdAt: new Date()
    };

    const result = await barbersCollection.insertOne(newBarber);
    console.log('🎉 Barber creado con ID:', result.insertedId);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

createBarber();
