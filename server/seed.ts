import { db } from './db';
import { usuarios, roles, administradores, libros, stock, calculateAge } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log('🌱 Inicio de sembrado de datos...');

  try {
    // Eliminar registros existentes para evitar duplicados
    console.log('🗑️  Limpiando tablas existentes...');
    await db.delete(administradores);
    await db.delete(stock);
    await db.delete(libros);
    await db.delete(usuarios);
    await db.delete(roles);

    // Crear roles
    console.log('👥 Creando roles...');
    const [userRole] = await db.insert(roles).values({
      nombre: "usuario"
    }).returning();

    const [adminRole] = await db.insert(roles).values({
      nombre: "administrador"
    }).returning();

    // Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    const adminPassword = await hashPassword("Admin123!");
    const adminBirthDate = new Date('1990-01-01');
    
    const [adminUser] = await db.insert(usuarios).values({
      nombre: "Administrador",
      email: "admin@gmail.com",
      password_hash: adminPassword,
      role_id: adminRole.id,
      birth_date: adminBirthDate
    }).returning();

    // Crear registro de administrador
    await db.insert(administradores).values({
      user_id: adminUser.id,
      is_superadmin: true
    });

    // Crear categorías de libros con 3 libros cada una
    const categorias = [
      "Ficción",
      "No Ficción",
      "Literatura Clásica",
      "Ciencia y Tecnología",
      "Infantil y Juvenil"
    ];

    // Datos de libros por categoría
    const librosPorCategoria: Record<string, { titulo: string, autor: string, published_year: number, description: string, imagen_url: string }[]> = {
      "Ficción": [
        {
          titulo: "Cien años de soledad",
          autor: "Gabriel García Márquez",
          published_year: 1967,
          description: "Una de las obras más importantes de la literatura latinoamericana, narra la historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.",
          imagen_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        },
        {
          titulo: "La ciudad y los perros",
          autor: "Mario Vargas Llosa",
          published_year: 1963,
          description: "Novela que relata la vida de un grupo de cadetes en el Colegio Militar Leoncio Prado de Lima. Aborda temas como la violencia, la corrupción y la formación del carácter.",
          imagen_url: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        },
        {
          titulo: "La sombra del viento",
          autor: "Carlos Ruiz Zafón",
          published_year: 2001,
          description: "Una novela ambientada en la Barcelona posterior a la guerra civil española, que sigue la búsqueda de Daniel Sempere por descubrir los secretos detrás del autor de un libro misterioso que lo cautivó desde niño.",
          imagen_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        }
      ],
      "No Ficción": [
        {
          titulo: "Sapiens: De animales a dioses",
          autor: "Yuval Noah Harari",
          published_year: 2011,
          description: "Un recorrido por la historia de la humanidad, desde la aparición del homo sapiens hasta la actualidad, analizando cómo hemos llegado a dominar el planeta.",
          imagen_url: "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        },
        {
          titulo: "El infinito en un junco",
          autor: "Irene Vallejo",
          published_year: 2019,
          description: "Un ensayo sobre la historia de los libros, las bibliotecas y la pasión por la lectura a lo largo de los siglos, desde la antigüedad hasta nuestros días.",
          imagen_url: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        },
        {
          titulo: "Pensar rápido, pensar despacio",
          autor: "Daniel Kahneman",
          published_year: 2011,
          description: "Un estudio sobre cómo pensamos y tomamos decisiones, analizando los dos sistemas que guían nuestra mente: uno rápido, intuitivo y emocional, y otro más lento, deliberativo y lógico.",
          imagen_url: "https://images.unsplash.com/photo-1456081445452-e3e27c71b14e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        }
      ],
      "Literatura Clásica": [
        {
          titulo: "Don Quijote de la Mancha",
          autor: "Miguel de Cervantes",
          published_year: 1605,
          description: "Considerada como la primera novela moderna y una de las obras más destacadas de la literatura española y universal. Narra las aventuras de un hidalgo que, enloquecido por la lectura de libros de caballerías, decide convertirse en caballero andante.",
          imagen_url: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        },
        {
          titulo: "Crimen y castigo",
          autor: "Fiódor Dostoyevski",
          published_year: 1866,
          description: "Una de las obras más influyentes de la literatura rusa, narra la historia de Rodión Raskólnikov, un estudiante que elabora un plan para asesinar a una vieja prestamista y enfrentarse a las consecuencias morales y psicológicas de su crimen.",
          imagen_url: "https://images.unsplash.com/photo-1585150525856-c88bebab0e4b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        },
        {
          titulo: "Orgullo y prejuicio",
          autor: "Jane Austen",
          published_year: 1813,
          description: "Una novela de costumbres que narra la historia de Elizabeth Bennet y su compleja relación con el señor Darcy, explorando temas como el amor, el matrimonio, la educación y la moral en la Inglaterra rural de principios del siglo XIX.",
          imagen_url: "https://images.unsplash.com/photo-1528212369236-9775163c2f9f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        }
      ],
      "Ciencia y Tecnología": [
        {
          titulo: "Una breve historia del tiempo",
          autor: "Stephen Hawking",
          published_year: 1988,
          description: "Un libro de divulgación científica que explora varios temas de la física moderna, desde la teoría del Big Bang hasta los agujeros negros, intentando explicar conceptos complejos de manera accesible para el público general.",
          imagen_url: "https://images.unsplash.com/photo-1583086762675-5c0f6da44e4a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        },
        {
          titulo: "El gen egoísta",
          autor: "Richard Dawkins",
          published_year: 1976,
          description: "Un libro que reformuló la teoría de la evolución desde la perspectiva del gen, en lugar del individuo o la especie, y que introdujo el concepto de meme como unidad de información cultural.",
          imagen_url: "https://images.unsplash.com/photo-1594897030264-9020ab2ae10d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        },
        {
          titulo: "Cosmos",
          autor: "Carl Sagan",
          published_year: 1980,
          description: "Un viaje a través del universo que explora temas como la evolución estelar, la formación de la Tierra, el origen de la vida y la posibilidad de vida extraterrestre, combinando ciencia, filosofía e historia.",
          imagen_url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        }
      ],
      "Infantil y Juvenil": [
        {
          titulo: "Harry Potter y la piedra filosofal",
          autor: "J.K. Rowling",
          published_year: 1997,
          description: "La primera entrega de la serie Harry Potter, donde conocemos a un niño huérfano que descubre que es un mago y comienza su educación en Hogwarts, una escuela de magia y hechicería.",
          imagen_url: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        },
        {
          titulo: "El principito",
          autor: "Antoine de Saint-Exupéry",
          published_year: 1943,
          description: "Una fábula filosófica que narra el encuentro de un piloto estrellado en el desierto con un pequeño príncipe proveniente de otro planeta, reflexionando sobre la amistad, el amor y el sentido de la vida.",
          imagen_url: "https://images.unsplash.com/photo-1573058683470-7afc5c008d43?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        },
        {
          titulo: "Matilda",
          autor: "Roald Dahl",
          published_year: 1988,
          description: "La historia de una niña prodigio con poderes telequinéticos que usa su inteligencia y sus habilidades para superar a sus padres abusivos y a la terrible directora de su escuela.",
          imagen_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        }
      ]
    };

    console.log('📚 Creando libros...');
   // Crear libros y su stock
for (const categoria of categorias) {
  const librosDeCategoria = librosPorCategoria[categoria] || [];
  
  for (const libroData of librosDeCategoria) {
    // Verificar si ya existe el libro
    const libroExistente = await db
      .select()
      .from(libros)
      .where(eq(libros.titulo, libroData.titulo));

    let libroId: number;

    if (libroExistente.length === 0) {
      // Crear libro
      const [libro] = await db.insert(libros).values({
        titulo: libroData.titulo,
        autor: libroData.autor,
        published_year: libroData.published_year,
        description: libroData.description,
        categoria: categoria,
        imagen_url: libroData.imagen_url
      }).returning();
      libroId = libro.id;
    } else {
      libroId = libroExistente[0].id;
    }

    // Verificar si ya hay stock creado para ese libro
    const stockExistente = await db
      .select()
      .from(stock)
      .where(eq(stock.book_id, libroId));

    if (stockExistente.length === 0) {
      await db.insert(stock).values({
        book_id: libroId,
        total_copies: 50,
        available_copies: Math.floor(Math.random() * 50) + 1
      });
    }
  }
}

    console.log('✅ Sembrado de datos completado con éxito!');
  } catch (error) {
    console.error('❌ Error durante el sembrado de datos:', error);
  }
}

// Ejecutar la función de sembrado
seed().then(() => {
  console.log('🚀 El proceso de sembrado ha finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error crítico durante el sembrado:', error);
  process.exit(1);
});