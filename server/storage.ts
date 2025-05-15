import { 
  usuarios, 
  roles, 
  administradores, 
  libros, 
  stock, 
  historico_stock, 
  comentarios, 
  loans, 
  logs, 
  Usuario, 
  InsertUsuario, 
  InsertLibro, 
  Libro, 
  InsertComentario, 
  Comentario, 
  InsertLoan, 
  Loan,
  LibroWithStock,
  LibroWithRating,
  ComentarioWithUser,
  LoanWithBookInfo
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { format } from "date-fns";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;

  // User related methods
  getUser(id: number): Promise<Usuario | undefined>;
  getUserByEmail(email: string): Promise<Usuario | undefined>;
  createUser(user: InsertUsuario): Promise<Usuario>;
  getAllUsers(): Promise<Usuario[]>;
  updateUserStatus(id: number, activo: boolean): Promise<Usuario | undefined>;
  isUserAdmin(userId: number): Promise<boolean>;

  // Book related methods
  getAllLibros(categoria?: string, searchTerm?: string): Promise<LibroWithRating[]>;
  getLibroById(id: number): Promise<LibroWithRating | undefined>;
  getLibrosDestacados(): Promise<LibroWithRating[]>;
  getAllCategorias(): Promise<{categoria: string, count: number}[]>;
  createLibro(libro: InsertLibro): Promise<Libro>;
  updateLibro(id: number, libro: InsertLibro): Promise<Libro | undefined>;
  deleteLibro(id: number): Promise<boolean>;
  updateStockLibro(id: number, totalCopies: number, availableCopies: number, adminId: number): Promise<LibroWithStock | undefined>;

  // Comment related methods
  getComentariosByLibroId(libroId: number): Promise<ComentarioWithUser[]>;
  getUserComentarioForLibro(userId: number, libroId: number): Promise<Comentario | undefined>;
  createComentario(comentario: InsertComentario): Promise<Comentario>;

  // Loan related methods
  getLoansForUser(userId: number): Promise<LoanWithBookInfo[]>;
  getLoanHistoryForUser(userId: number): Promise<LoanWithBookInfo[]>;
  getActiveLoanForBookAndUser(bookId: number, userId: number): Promise<Loan | undefined>;
  getLoanById(id: number): Promise<Loan | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  returnLoan(id: number): Promise<Loan>;
  getAllActiveLoans(): Promise<LoanWithBookInfo[]>;
  // Función de búsqueda
  searchBooks(searchTerm: string): Promise<{libros: LibroWithRating[], categorias: {categoria: string, count: number}[]}>;
}

import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, sql, desc, asc, or, isNull, gt, lt } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      createTableIfMissing: true,
      conObject: {
        connectionString: process.env.DATABASE_URL
      }
    });
  }

  // User methods
  async getUser(id: number): Promise<Usuario | undefined> {
    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<Usuario | undefined> {
    const [user] = await db.select().from(usuarios).where(sql`LOWER(${usuarios.email}) = LOWER(${email})`);
    return user;
  }

  async createUser(userData: InsertUsuario): Promise<Usuario> {
    const [user] = await db.insert(usuarios).values(userData).returning();
    return user;
  }

  async getAllUsers(): Promise<Usuario[]> {
    return await db.select().from(usuarios);
  }

  async updateUserStatus(id: number, activo: boolean): Promise<Usuario | undefined> {
    // En este caso, activo/inactivo podría manejarse con un campo adicional
    // Para esta implementación, simplemente devolvemos el usuario actualizado
    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, id));
    return user;
  }

  async isUserAdmin(userId: number): Promise<boolean> {
    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, userId));
    if (!user) return false;
    
    // Verificar si tiene rol de administrador (role_id = 2)
    if (user.role_id === 2) return true;
    
    // Verificar si está en la tabla de administradores
    const [admin] = await db.select().from(administradores).where(eq(administradores.user_id, userId));
    return !!admin;
  }

  // Book methods
  async getAllLibros(categoria?: string, searchTerm?: string): Promise<LibroWithRating[]> {
    let query = db.select().from(libros);
    
    // Filtrar por categoría si se especifica
    if (categoria && categoria !== "todas") {
      query = query.where(eq(libros.categoria, categoria));
    }
    
    // Filtrar por término de búsqueda si se especifica
    if (searchTerm) {
      const term = `%${searchTerm.toLowerCase()}%`;
      query = query.where(
        or(
          sql`lower(${libros.titulo}) like ${term}`,
          sql`lower(${libros.autor}) like ${term}`
        )
      );
    }
    
    const books = await query;
    
    // Obtener información de stock y calificaciones
    const booksWithInfo = await Promise.all(books.map(book => this._addStockAndRatingToBook(book)));
    
    return booksWithInfo;
  }

  async getLibroById(id: number): Promise<LibroWithRating | undefined> {
    const [book] = await db.select().from(libros).where(eq(libros.id, id));
    if (!book) return undefined;
    
    return await this._addStockAndRatingToBook(book);
  }

  async getLibrosDestacados(): Promise<LibroWithRating[]> {
    // Obtener todos los libros y ordenarlos por calificación
    const books = await db.select().from(libros);
    const booksWithRating = await Promise.all(books.map(book => this._addStockAndRatingToBook(book)));
    
    // Ordenar por calificación y devolver los 5 primeros
    return booksWithRating
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);
  }

  async getAllCategorias(): Promise<{categoria: string, count: number}[]> {
    const result = await db.execute<{categoria: string, count: number}>(
      sql`SELECT categoria, COUNT(*) as count FROM ${libros} GROUP BY categoria ORDER BY count DESC`
    );
    
    return result.rows;
  }

  async createLibro(libroData: InsertLibro): Promise<Libro> {
    const [libro] = await db.insert(libros).values(libroData).returning();
    
    // Crear stock por defecto
    await db.insert(stock).values({
      book_id: libro.id,
      total_copies: 50,
      available_copies: 50
    });
    
    return libro;
  }

  async updateLibro(id: number, libroData: InsertLibro): Promise<Libro | undefined> {
    const [libro] = await db
      .update(libros)
      .set(libroData)
      .where(eq(libros.id, id))
      .returning();
    
    return libro;
  }

  async deleteLibro(id: number): Promise<boolean> {
    await db.delete(libros).where(eq(libros.id, id));
    return true;
  }

  async updateStockLibro(id: number, totalCopies: number, availableCopies: number, adminId: number): Promise<LibroWithStock | undefined> {
    // Actualizar el stock
    const [stockData] = await db
      .update(stock)
      .set({
        total_copies: totalCopies,
        available_copies: availableCopies
      })
      .where(eq(stock.book_id, id))
      .returning();
    
    if (!stockData) {
      // Si no existe, crearlo
      await db.insert(stock).values({
        book_id: id,
        total_copies: totalCopies,
        available_copies: availableCopies
      });
    }
    
    // Registrar en historial
    await db.insert(historico_stock).values({
      book_id: id,
      change_type: "stock_update",
      quantity_changed: totalCopies,
      admin_id: adminId
    });
    
    // Obtener el libro con la información de stock
    const book = await this.getLibroById(id);
    if (!book) return undefined;
    
    return {
      ...book,
      totalCopies,
      availableCopies,
      averageRating: 0,
      commentCount: 0
    };
  }

  // Comment methods
  async getComentariosByLibroId(libroId: number): Promise<ComentarioWithUser[]> {
    const comments = await db
      .select({
        comentario: comentarios,
        usuario: {
          nombre: usuarios.nombre
        }
      })
      .from(comentarios)
      .innerJoin(usuarios, eq(comentarios.user_id, usuarios.id))
      .where(eq(comentarios.book_id, libroId));
    
    return comments.map(row => ({
      ...row.comentario,
      usuario: row.usuario
    }));
  }

  async getUserComentarioForLibro(userId: number, libroId: number): Promise<Comentario | undefined> {
    const [comment] = await db
      .select()
      .from(comentarios)
      .where(
        and(
          eq(comentarios.user_id, userId),
          eq(comentarios.book_id, libroId)
        )
      );
    
    return comment;
  }

  async createComentario(comentarioData: InsertComentario): Promise<Comentario> {
    const [comentario] = await db
      .insert(comentarios)
      .values(comentarioData)
      .returning();
    
    return comentario;
  }

  // Loan methods
  async getLoansForUser(userId: number): Promise<LoanWithBookInfo[]> {
    const resultado = await db
      .select({
        loan: loans,
        libro: {
          id: libros.id,
          titulo: libros.titulo,
          autor: libros.autor,
          imagen_url: libros.imagen_url
        }
      })
      .from(loans)
      .innerJoin(libros, eq(loans.book_id, libros.id))
      .where(
        and(
          eq(loans.user_id, userId),
          eq(loans.status, "prestado")
        )
      );
    
    return resultado.map(row => ({
      ...row.loan,
      libro: row.libro
    }));
  }

  async getLoanHistoryForUser(userId: number): Promise<LoanWithBookInfo[]> {
    const resultado = await db
      .select({
        loan: loans,
        libro: {
          id: libros.id,
          titulo: libros.titulo,
          autor: libros.autor,
          imagen_url: libros.imagen_url
        }
      })
      .from(loans)
      .innerJoin(libros, eq(loans.book_id, libros.id))
      .where(
        and(
          eq(loans.user_id, userId),
          eq(loans.status, "devuelto")
        )
      );
    
    return resultado.map(row => ({
      ...row.loan,
      libro: row.libro
    }));
  }

  async getActiveLoanForBookAndUser(bookId: number, userId: number): Promise<Loan | undefined> {
    const [loan] = await db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.book_id, bookId),
          eq(loans.user_id, userId),
          eq(loans.status, "prestado")
        )
      );
    
    return loan;
  }

  async getLoanById(id: number): Promise<Loan | undefined> {
    const [loan] = await db
      .select()
      .from(loans)
      .where(eq(loans.id, id));
    
    return loan;
  }

  async createLoan(loanData: InsertLoan): Promise<Loan> {
    // Crear el préstamo
    const [loan] = await db
      .insert(loans)
      .values(loanData)
      .returning();
    
    // Actualizar el stock
    const [stockItem] = await db
      .select()
      .from(stock)
      .where(eq(stock.book_id, loanData.book_id));
    
    if (stockItem) {
      await db
        .update(stock)
        .set({
          available_copies: stockItem.available_copies - 1
        })
        .where(eq(stock.book_id, loanData.book_id));
    }
    
    // Registrar el evento
    await db.insert(logs).values({
      loan_id: loan.id,
      event_type: "prestamo_creado"
    });
    
    return loan;
  }

  async returnLoan(id: number): Promise<Loan> {
    // Actualizar el préstamo
    const [loan] = await db
      .update(loans)
      .set({
        status: "devuelto"
      })
      .where(eq(loans.id, id))
      .returning();
    
    // Actualizar el stock
    const [stockItem] = await db
      .select()
      .from(stock)
      .where(eq(stock.book_id, loan.book_id));
    
    if (stockItem) {
      await db
        .update(stock)
        .set({
          available_copies: stockItem.available_copies + 1
        })
        .where(eq(stock.book_id, loan.book_id));
    }
    
    // Registrar el evento
    await db.insert(logs).values({
      loan_id: loan.id,
      event_type: "prestamo_devuelto"
    });
    
    return loan;
  }

  async getAllActiveLoans(): Promise<LoanWithBookInfo[]> {
    const resultado = await db
      .select({
        loan: loans,
        libro: {
          id: libros.id,
          titulo: libros.titulo,
          autor: libros.autor,
          imagen_url: libros.imagen_url
        }
      })
      .from(loans)
      .innerJoin(libros, eq(loans.book_id, libros.id))
      .where(eq(loans.status, "prestado"));
    
    return resultado.map(row => ({
      ...row.loan,
      libro: row.libro
    }));
  }

  // Helper methods
  private async _addStockAndRatingToBook(book: Libro): Promise<LibroWithRating> {
    // Obtener información de stock
    const [stockItem] = await db
      .select()
      .from(stock)
      .where(eq(stock.book_id, book.id));
    
    const totalCopies = stockItem?.total_copies || 50;
    const availableCopies = stockItem?.available_copies || 50;
    
    // Obtener calificaciones y comentarios
    const comentariosResult = await db
      .select({
        count: sql<number>`count(*)`,
        avg: sql<number>`avg(${comentarios.rating})`
      })
      .from(comentarios)
      .where(eq(comentarios.book_id, book.id));
    
    const commentCount = Number(comentariosResult[0]?.count || 0);
    const averageRating = Number(comentariosResult[0]?.avg || 0);
    
    return {
      ...book,
      totalCopies,
      availableCopies,
      commentCount,
      averageRating: Math.round(averageRating * 10) / 10  // Redondear a 1 decimal
    };
  }

  async searchBooks(searchTerm: string): Promise<{libros: LibroWithRating[], categorias: {categoria: string, count: number}[]}> {
    // Buscar coincidencias en libros
    const term = `%${searchTerm.toLowerCase()}%`;
    const librosResult = await db.select().from(libros).where(
        or(
            sql`lower(${libros.titulo}) like ${term}`,
            sql`lower(${libros.autor}) like ${term}`,
            sql`lower(${libros.description}) like ${term}`,
            sql`lower(${libros.categoria}) like ${term}`
        )
    );

    const librosWithInfo = await Promise.all(librosResult.map(book => this._addStockAndRatingToBook(book)));

    // Buscar coincidencias en categorías
    const categoriasResult = await db.execute<{categoria: string, count: number}>(
        sql`SELECT categoria, COUNT(*) as count 
        FROM ${libros} 
        WHERE lower(categoria) like ${term} 
        GROUP BY categoria 
        ORDER BY count DESC`
    );

    return {
      libros: librosWithInfo,
      categorias: categoriasResult.rows
    };
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, Usuario>;
  private userRoles: Map<number, {id: number, nombre: string}>;
  private admins: Map<number, {id: number, user_id: number, is_superadmin: boolean}>;
  private books: Map<number, Libro>;
  private bookStock: Map<number, {id: number, book_id: number, total_copies: number, available_copies: number}>;
  private bookComments: Map<number, Comentario>;
  private bookLoans: Map<number, Loan>;
  private bookLogs: Map<number, {id: number, loan_id: number, event_type: string, timestamp: Date}>;
  sessionStore: session.SessionStore;
  
  private userIdCounter: number = 1;
  private roleIdCounter: number = 1;
  private adminIdCounter: number = 1;
  private bookIdCounter: number = 1;
  private stockIdCounter: number = 1;
  private commentIdCounter: number = 1;
  private loanIdCounter: number = 1;
  private logIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.userRoles = new Map();
    this.admins = new Map();
    this.books = new Map();
    this.bookStock = new Map();
    this.bookComments = new Map();
    this.bookLoans = new Map();
    this.bookLogs = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize with some default data
    this._initializeData();
  }

  // Initialize with some default data for testing
  private _initializeData() {
    // Create roles
    const userRole = { id: this.roleIdCounter++, nombre: "usuario" };
    const adminRole = { id: this.roleIdCounter++, nombre: "administrador" };
    
    this.userRoles.set(userRole.id, userRole);
    this.userRoles.set(adminRole.id, adminRole);

    // Create admin user
    const adminUser: Usuario = {
      id: this.userIdCounter++,
      nombre: "Admin",
      email: "admin@gmail.com",
      password_hash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918.45a7dfc69d28f4c155c1c0214d4d1f71", // admin
      role_id: adminRole.id,
      created_at: new Date()
    };
    
    this.users.set(adminUser.id, adminUser);
    
    // Create admin record
    const admin = {
      id: this.adminIdCounter++,
      user_id: adminUser.id,
      is_superadmin: true
    };
    
    this.admins.set(admin.id, admin);

    // Create some books
    const books = [
      {
        id: this.bookIdCounter++,
        titulo: "Cien años de soledad",
        autor: "Gabriel García Márquez",
        published_year: 1967,
        description: "Una de las obras más importantes de la literatura latinoamericana, narra la historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.",
        categoria: "Clásicos",
        imagen_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
        created_at: new Date()
      },
      {
        id: this.bookIdCounter++,
        titulo: "El amor en los tiempos del cólera",
        autor: "Gabriel García Márquez",
        published_year: 1985,
        description: "Una historia de amor que transcurre a finales del siglo XIX y principios del XX, que narra el romance entre Florentino Ariza y Fermina Daza.",
        categoria: "Románticos",
        imagen_url: "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
        created_at: new Date()
      },
      {
        id: this.bookIdCounter++,
        titulo: "Don Quijote de la Mancha",
        autor: "Miguel de Cervantes",
        published_year: 1605,
        description: "Considerada como la primera novela moderna y una de las obras más destacadas de la literatura española y universal. Narra las aventuras de un hidalgo que, enloquecido por la lectura de libros de caballerías, decide convertirse en caballero andante.",
        categoria: "Clásicos",
        imagen_url: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
        created_at: new Date()
      },
      {
        id: this.bookIdCounter++,
        titulo: "Pedro Páramo",
        autor: "Juan Rulfo",
        published_year: 1955,
        description: "Novela que mezcla realidad y fantasía, narrada a través de fragmentos que se mueven entre el presente y el pasado. Juan Preciado viaja a Comala para conocer a su padre, Pedro Páramo, pero solo encuentra un pueblo habitado por fantasmas.",
        categoria: "Clásicos",
        imagen_url: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
        created_at: new Date()
      },
      {
        id: this.bookIdCounter++,
        titulo: "La sombra del viento",
        autor: "Carlos Ruiz Zafón",
        published_year: 2001,
        description: "Una novela ambientada en la Barcelona posterior a la guerra civil española, que sigue la búsqueda de Daniel Sempere por descubrir los secretos detrás del autor de un libro misterioso que lo cautivó desde niño.",
        categoria: "Misterio",
        imagen_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
        created_at: new Date()
      },
      {
        id: this.bookIdCounter++,
        titulo: "Rayuela",
        autor: "Julio Cortázar",
        published_year: 1963,
        description: "Una novela experimental que se puede leer de múltiples formas. Narra la historia de Horacio Oliveira, sus reflexiones filosóficas y su búsqueda existencial entre París y Buenos Aires.",
        categoria: "Clásicos",
        imagen_url: "https://images.unsplash.com/photo-1551029506-0807df4e2031?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
        created_at: new Date()
      }
    ];
    
    // Create stock for each book
    books.forEach(book => {
      this.books.set(book.id, book);
      
      const stockItem = {
        id: this.stockIdCounter++,
        book_id: book.id,
        total_copies: 50,
        available_copies: Math.floor(Math.random() * 50) + 1 // Random available copies
      };
      
      this.bookStock.set(stockItem.id, stockItem);
    });
  }

  // User methods
  async getUser(id: number): Promise<Usuario | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<Usuario | undefined> {
    return Array.from(this.users.values()).find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  async createUser(userData: InsertUsuario): Promise<Usuario> {
    const id = this.userIdCounter++;
    const user: Usuario = {
      ...userData,
      id,
      created_at: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<Usuario[]> {
    return Array.from(this.users.values());
  }

  async updateUserStatus(id: number, activo: boolean): Promise<Usuario | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    // In a real database we'd have an 'active' field
    // For demo purposes, we're just returning the user
    return user;
  }

  async isUserAdmin(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Check if user has admin role
    if (user.role_id === 2) return true;
    
    // Check if user is in admins table
    return Array.from(this.admins.values()).some(admin => admin.user_id === userId);
  }

  // Book methods
  async getAllLibros(categoria?: string, searchTerm?: string): Promise<LibroWithRating[]> {
    let filteredBooks = Array.from(this.books.values());
    
    // Filter by category if specified
    if (categoria && categoria !== "todas") {
      filteredBooks = filteredBooks.filter(book => book.categoria === categoria);
    }
    
    // Filter by search term if specified
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredBooks = filteredBooks.filter(book => 
        book.titulo.toLowerCase().includes(term) || 
        book.autor.toLowerCase().includes(term)
      );
    }
    
    // Add stock and rating information
    return filteredBooks.map(book => this._addStockAndRatingToBook(book));
  }

  async getLibroById(id: number): Promise<LibroWithRating | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;
    
    return this._addStockAndRatingToBook(book);
  }

  async getLibrosDestacados(): Promise<LibroWithRating[]> {
    // For demo, we'll consider books with highest ratings as featured
    const booksWithRatings = Array.from(this.books.values()).map(book => 
      this._addStockAndRatingToBook(book)
    );
    
    // Sort by rating and return top 5
    return booksWithRatings
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);
  }

  async getAllCategorias(): Promise<{categoria: string, count: number}[]> {
    const categorias = new Map<string, number>();
    
    Array.from(this.books.values()).forEach(book => {
      const count = categorias.get(book.categoria) || 0;
      categorias.set(book.categoria, count + 1);
    });
    
    return Array.from(categorias.entries()).map(([categoria, count]) => ({
      categoria,
      count
    }));
  }

  async createLibro(libroData: InsertLibro): Promise<Libro> {
    const id = this.bookIdCounter++;
    const libro: Libro = {
      ...libroData,
      id,
      created_at: new Date()
    };
    
    this.books.set(id, libro);
    
    // Create stock entry for the book
    const stockItem = {
      id: this.stockIdCounter++,
      book_id: id,
      total_copies: 50,
      available_copies: 50
    };
    
    this.bookStock.set(stockItem.id, stockItem);
    
    return libro;
  }

  async updateLibro(id: number, libroData: InsertLibro): Promise<Libro | undefined> {
    const existing = this.books.get(id);
    if (!existing) return undefined;
    
    const updatedLibro: Libro = {
      ...existing,
      ...libroData,
      id
    };
    
    this.books.set(id, updatedLibro);
    return updatedLibro;
  }

  async deleteLibro(id: number): Promise<boolean> {
    // Check if book has active loans
    const hasActiveLoans = Array.from(this.bookLoans.values()).some(
      loan => loan.book_id === id && loan.status === "prestado"
    );
    
    if (hasActiveLoans) {
      throw new Error("No se puede eliminar un libro con préstamos activos");
    }
    
    return this.books.delete(id);
  }

  async updateStockLibro(id: number, totalCopies: number, availableCopies: number, adminId: number): Promise<LibroWithStock | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;
    
    // Find stock entry for this book
    const stockEntry = Array.from(this.bookStock.values()).find(stock => stock.book_id === id);
    if (!stockEntry) return undefined;
    
    // Update stock
    const updatedStock = {
      ...stockEntry,
      total_copies: totalCopies,
      available_copies: availableCopies
    };
    
    this.bookStock.set(stockEntry.id, updatedStock);
    
    // Return the book with updated stock info
    return {
      ...book,
      availableCopies,
      totalCopies
    };
  }

  // Comment methods
  async getComentariosByLibroId(libroId: number): Promise<ComentarioWithUser[]> {
    const comentarios = Array.from(this.bookComments.values())
      .filter(comment => comment.book_id === libroId);
    
    return Promise.all(comentarios.map(async comment => {
      const user = await this.getUser(comment.user_id);
      return {
        ...comment,
        usuario: {
          nombre: user?.nombre || "Usuario desconocido"
        }
      };
    }));
  }

  async getUserComentarioForLibro(userId: number, libroId: number): Promise<Comentario | undefined> {
    return Array.from(this.bookComments.values()).find(
      comment => comment.user_id === userId && comment.book_id === libroId
    );
  }

  async createComentario(comentarioData: InsertComentario): Promise<Comentario> {
    const id = this.commentIdCounter++;
    const comentario: Comentario = {
      ...comentarioData,
      id,
      created_at: new Date()
    };
    
    this.bookComments.set(id, comentario);
    return comentario;
  }

  // Loan methods
  async getLoansForUser(userId: number): Promise<LoanWithBookInfo[]> {
    const loans = Array.from(this.bookLoans.values())
      .filter(loan => loan.user_id === userId && loan.status === "prestado");
    
    return Promise.all(loans.map(async loan => {
      const book = this.books.get(loan.book_id);
      return {
        ...loan,
        libro: {
          id: book?.id || 0,
          titulo: book?.titulo || "Libro desconocido",
          autor: book?.autor || "Autor desconocido",
          imagen_url: book?.imagen_url || ""
        }
      };
    }));
  }

  async getLoanHistoryForUser(userId: number): Promise<LoanWithBookInfo[]> {
    const loans = Array.from(this.bookLoans.values())
      .filter(loan => loan.user_id === userId && loan.status === "devuelto");
    
    return Promise.all(loans.map(async loan => {
      const book = this.books.get(loan.book_id);
      return {
        ...loan,
        libro: {
          id: book?.id || 0,
          titulo: book?.titulo || "Libro desconocido",
          autor: book?.autor || "Autor desconocido",
          imagen_url: book?.imagen_url || ""
        }
      };
    }));
  }

  async getActiveLoanForBookAndUser(bookId: number, userId: number): Promise<Loan | undefined> {
    return Array.from(this.bookLoans.values()).find(
      loan => loan.book_id === bookId && loan.user_id === userId && loan.status === "prestado"
    );
  }

  async getLoanById(id: number): Promise<Loan | undefined> {
    return this.bookLoans.get(id);
  }

  async createLoan(loanData: InsertLoan): Promise<Loan> {
    // Find the stock entry for this book
    const stockEntry = Array.from(this.bookStock.values()).find(stock => stock.book_id === loanData.book_id);
    
    if (!stockEntry || stockEntry.available_copies <= 0) {
      throw new Error("No hay copias disponibles de este libro");
    }
    
    // Update available copies
    const updatedStock = {
      ...stockEntry,
      available_copies: stockEntry.available_copies - 1
    };
    
    this.bookStock.set(stockEntry.id, updatedStock);
    
    // Create loan entry
    const id = this.loanIdCounter++;
    const loan: Loan = {
      ...loanData,
      id
    };
    
    this.bookLoans.set(id, loan);
    
    // Create log entry for the loan
    const logId = this.logIdCounter++;
    const log = {
      id: logId,
      loan_id: id,
      event_type: "prestamo",
      timestamp: new Date()
    };
    
    this.bookLogs.set(logId, log);
    
    return loan;
  }

  async returnLoan(id: number): Promise<Loan> {
    const loan = this.bookLoans.get(id);
    if (!loan) {
      throw new Error("Préstamo no encontrado");
    }
    
    if (loan.status !== "prestado") {
      throw new Error("Este préstamo ya ha sido devuelto");
    }
    
    // Find the stock entry for this book
    const stockEntry = Array.from(this.bookStock.values()).find(stock => stock.book_id === loan.book_id);
    
    if (stockEntry) {
      // Update available copies
      const updatedStock = {
        ...stockEntry,
        available_copies: Math.min(stockEntry.available_copies + 1, stockEntry.total_copies)
      };
      
      this.bookStock.set(stockEntry.id, updatedStock);
    }
    
    // Update loan status
    const updatedLoan: Loan = {
      ...loan,
      status: "devuelto"
    };
    
    this.bookLoans.set(id, updatedLoan);
    
    // Create log entry for the return
    const logId = this.logIdCounter++;
    const log = {
      id: logId,
      loan_id: id,
      event_type: "devolucion",
      timestamp: new Date()
    };
    
    this.bookLogs.set(logId, log);
    
    return updatedLoan;
  }

  async getAllActiveLoans(): Promise<LoanWithBookInfo[]> {
    const loans = Array.from(this.bookLoans.values())
      .filter(loan => loan.status === "prestado");
    
    return Promise.all(loans.map(async loan => {
      const book = this.books.get(loan.book_id);
      const user = await this.getUser(loan.user_id);
      
      return {
        ...loan,
        libro: {
          id: book?.id || 0,
          titulo: book?.titulo || "Libro desconocido",
          autor: book?.autor || "Autor desconocido",
          imagen_url: book?.imagen_url || ""
        },
        usuario: {
          nombre: user?.nombre || "Usuario desconocido"
        }
      };
    }));
  }

  // Helper methods
  private _addStockAndRatingToBook(book: Libro): LibroWithRating {
    // Get stock information
    const stockEntry = Array.from(this.bookStock.values()).find(stock => stock.book_id === book.id);
    
    // Get comments/ratings for this book
    const bookComments = Array.from(this.bookComments.values()).filter(comment => comment.book_id === book.id);
    
    // Calculate average rating
    let averageRating = 0;
    if (bookComments.length > 0) {
      const totalRating = bookComments.reduce((sum, comment) => sum + comment.rating, 0);
      averageRating = totalRating / bookComments.length;
    }
    
    return {
      ...book,
      availableCopies: stockEntry?.available_copies || 0,
      totalCopies: stockEntry?.total_copies || 0,
      averageRating,
      commentCount: bookComments.length
    };
  }
}

export const storage = new DatabaseStorage();
