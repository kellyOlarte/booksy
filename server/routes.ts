import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getCategories } from "./categories"; 
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertLibroSchema, 
  insertComentarioSchema, 
  insertLoanSchema,
  LibroWithRating,
  ComentarioWithUser
} from "@shared/schema";
import { z } from "zod";

// Middleware para verificar autenticación
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Debes iniciar sesión para realizar esta acción" });
  }
  next();
};

// Middleware para verificar si el usuario es administrador
const isAdmin = async (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Debes iniciar sesión para realizar esta acción" });
  }

  try {
    const isAdmin = await storage.isUserAdmin(req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Error al verificar permisos" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuración de autenticación
  setupAuth(app);

  // API Endpoints - Libros
  
  // Obtener todos los libros con stock y rating
  app.get("/api/libros", async (req, res) => {
    try {
      const categoria = req.query.categoria as string | undefined;
      const searchTerm = req.query.search as string | undefined;
      const libros = await storage.getAllLibros(categoria, searchTerm);
      res.json(libros);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener libros" });
    }
  });

  // Obtener libros destacados
  app.get("/api/libros/destacados", async (req, res) => {
    try {
      const destacados = await storage.getLibrosDestacados();
      res.json(destacados);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener libros destacados" });
    }
  });

  // Obtener la categoria de los libros
  app.get("/api/categories", getCategories);

  // Obtener libros por categoría
  app.get("/api/categorias", async (req, res) => {
    try {
      const categorias = await storage.getAllCategorias();
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener categorías" });
    }
  });

  // Obtener libro por ID con detalles completos
  app.get("/api/libros/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de libro inválido" });
      }
      
      const libro = await storage.getLibroById(id);
      if (!libro) {
        return res.status(404).json({ message: "Libro no encontrado" });
      }
      
      res.json(libro);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener el libro" });
    }
  });

  // Crear nuevo libro (admin)
  app.post("/api/libros", isAdmin, async (req, res) => {
    try {
      const libroData = insertLibroSchema.parse(req.body);
      const newLibro = await storage.createLibro(libroData);
      res.status(201).json(newLibro);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos del libro inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear el libro" });
    }
  });

  // Actualizar libro (admin)
  app.put("/api/libros/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de libro inválido" });
      }
      
      const libroData = insertLibroSchema.parse(req.body);
      const updatedLibro = await storage.updateLibro(id, libroData);
      
      if (!updatedLibro) {
        return res.status(404).json({ message: "Libro no encontrado" });
      }
      
      res.json(updatedLibro);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos del libro inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar el libro" });
    }
  });

  // Eliminar libro (admin)
  app.delete("/api/libros/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de libro inválido" });
      }
      
      const deleted = await storage.deleteLibro(id);
      if (!deleted) {
        return res.status(404).json({ message: "Libro no encontrado" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar el libro" });
    }
  });

  // Actualizar stock de libro (admin)
  app.put("/api/libros/:id/stock", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de libro inválido" });
      }

      const schema = z.object({
        totalCopies: z.number().min(0).max(1000),
        availableCopies: z.number().min(0)
      });
      
      const { totalCopies, availableCopies } = schema.parse(req.body);
      
      if (availableCopies > totalCopies) {
        return res.status(400).json({ message: "Las copias disponibles no pueden ser mayores que el total" });
      }
      
      const updatedStock = await storage.updateStockLibro(id, totalCopies, availableCopies, req.user.id);
      
      if (!updatedStock) {
        return res.status(404).json({ message: "Libro no encontrado" });
      }
      
      res.json(updatedStock);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos de stock inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar el stock" });
    }
  });

  // API Endpoints - Comentarios
  
  // Obtener comentarios de un libro
  app.get("/api/libros/:id/comentarios", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de libro inválido" });
      }
      
      const comentarios = await storage.getComentariosByLibroId(id);
      res.json(comentarios);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  // Crear comentario (usuario autenticado)
  app.post("/api/libros/:id/comentarios", isAuthenticated, async (req, res) => {
    try {
      const libroId = parseInt(req.params.id);
      if (isNaN(libroId)) {
        return res.status(400).json({ message: "ID de libro inválido" });
      }
      
      // Verificar si el usuario ya comentó este libro
      const existingComment = await storage.getUserComentarioForLibro(req.user.id, libroId);
      if (existingComment) {
        return res.status(400).json({ message: "Ya has comentado este libro anteriormente" });
      }
      
      const comentarioData = insertComentarioSchema.parse({
        ...req.body,
        book_id: libroId,
        user_id: req.user.id
      });
      
      const newComentario = await storage.createComentario(comentarioData);
      res.status(201).json(newComentario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos del comentario inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear el comentario" });
    }
  });

  // API Endpoints - Préstamos
  
  // Obtener préstamos del usuario actual
  app.get("/api/prestamos", isAuthenticated, async (req, res) => {
    try {
      const prestamos = await storage.getLoansForUser(req.user.id);
      res.json(prestamos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener préstamos" });
    }
  });

  // Obtener historial de préstamos del usuario actual
  app.get("/api/prestamos/historial", isAuthenticated, async (req, res) => {
    try {
      const historial = await storage.getLoanHistoryForUser(req.user.id);
      res.json(historial);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener historial de préstamos" });
    }
  });

  // Crear nuevo préstamo
  app.post("/api/prestamos", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        book_id: z.number(),
        dias: z.number().min(1).max(90).default(30)
      });
      
      const { book_id, dias } = schema.parse(req.body);
      
      // Verificar disponibilidad del libro
      const libro = await storage.getLibroById(book_id);
      if (!libro) {
        return res.status(404).json({ message: "Libro no encontrado" });
      }
      
      if (libro.availableCopies <= 0) {
        return res.status(400).json({ message: "No hay copias disponibles de este libro" });
      }
      
      // Verificar si el usuario ya tiene un préstamo activo de este libro
      const existingLoan = await storage.getActiveLoanForBookAndUser(book_id, req.user.id);
      if (existingLoan) {
        return res.status(400).json({ message: "Ya tienes un préstamo activo de este libro" });
      }
      
      // Crear el préstamo
      const startDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dias);
      
      const loanData = {
        user_id: req.user.id,
        book_id,
        start_date: startDate,
        due_date: dueDate,
        status: "prestado"
      };
      
      const newLoan = await storage.createLoan(loanData);
      res.status(201).json(newLoan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos del préstamo inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear el préstamo" });
    }
  });

  // Devolver un libro prestado
  app.post("/api/prestamos/:id/devolver", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de préstamo inválido" });
      }
      
      // Verificar que el préstamo existe y pertenece al usuario
      const loan = await storage.getLoanById(id);
      if (!loan) {
        return res.status(404).json({ message: "Préstamo no encontrado" });
      }
      
      if (loan.user_id !== req.user.id) {
        return res.status(403).json({ message: "No tienes permisos para devolver este préstamo" });
      }
      
      if (loan.status !== "prestado") {
        return res.status(400).json({ message: "Este préstamo ya ha sido devuelto" });
      }
      
      // Devolver el libro
      const updatedLoan = await storage.returnLoan(id);
      res.json(updatedLoan);
    } catch (error) {
      res.status(500).json({ message: "Error al devolver el libro" });
    }
  });

  // API Endpoints - Admin
  
  // Obtener todos los usuarios (admin)
  app.get("/api/admin/usuarios", isAdmin, async (req, res) => {
    try {
      const usuarios = await storage.getAllUsers();
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  });

  // Obtener todos los préstamos activos (admin)
  app.get("/api/admin/prestamos", isAdmin, async (req, res) => {
    try {
      const prestamos = await storage.getAllActiveLoans();
      res.json(prestamos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener préstamos" });
    }
  });

  // Cambiar estado de un usuario (admin)
  app.put("/api/admin/usuarios/:id/estado", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }
      
      const schema = z.object({
        activo: z.boolean()
      });
      
      const { activo } = schema.parse(req.body);
      
      // No permitir desactivar al propio usuario administrador
      if (id === req.user.id && !activo) {
        return res.status(400).json({ message: "No puedes desactivar tu propia cuenta" });
      }
      
      const updatedUser = await storage.updateUserStatus(id, activo);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar estado del usuario" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
