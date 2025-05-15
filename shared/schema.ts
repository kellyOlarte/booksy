import { pgTable, text, serial, integer, boolean, timestamp, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Roles table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre").notNull()
});

export const insertRoleSchema = createInsertSchema(roles).pick({
  nombre: true
});

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// Users table
export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre").notNull(),
  email: varchar("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role_id: integer("role_id").notNull(),
  birth_date: date("birth_date").notNull(),
  created_at: timestamp("created_at").defaultNow()
});

export const insertUsuarioSchema = createInsertSchema(usuarios).pick({
  nombre: true,
  email: true,
  password_hash: true,
  role_id: true,
  birth_date: true
});

export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Usuario = typeof usuarios.$inferSelect;

// Administrators table
export const administradores = pgTable("administradores", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  is_superadmin: boolean("is_superadmin").default(false)
});

export const insertAdminSchema = createInsertSchema(administradores).pick({
  user_id: true,
  is_superadmin: true
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof administradores.$inferSelect;

// Books table
export const libros = pgTable("libros", {
  id: serial("id").primaryKey(),
  titulo: varchar("titulo").notNull(),
  autor: varchar("autor").notNull(),
  published_year: integer("published_year"),
  description: varchar("description"),
  created_at: timestamp("created_at").defaultNow(),
  categoria: varchar("categoria").default("General"),
  imagen_url: varchar("imagen_url").default("/placeholder-book.jpg")
});

export const insertLibroSchema = createInsertSchema(libros).pick({
  titulo: true,
  autor: true,
  published_year: true,
  description: true,
  categoria: true,
  imagen_url: true
});

export type InsertLibro = z.infer<typeof insertLibroSchema>;
export type Libro = typeof libros.$inferSelect;

// Stock table
export const stock = pgTable("stock", {
  id: serial("id").primaryKey(),
  book_id: integer("book_id").notNull(),
  total_copies: integer("total_copies").notNull().default(50),
  available_copies: integer("available_copies").notNull().default(50)
});

export const insertStockSchema = createInsertSchema(stock).pick({
  book_id: true,
  total_copies: true,
  available_copies: true
});

export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stock.$inferSelect;

// Historical stock table
export const historico_stock = pgTable("historico_stock", {
  id: serial("id").primaryKey(),
  book_id: integer("book_id").notNull(),
  change_type: varchar("change_type").notNull(),
  quantity_changed: integer("quantity_changed").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  admin_id: integer("admin_id")
});

export const insertHistoricoStockSchema = createInsertSchema(historico_stock).pick({
  book_id: true,
  change_type: true,
  quantity_changed: true,
  admin_id: true
});

export type InsertHistoricoStock = z.infer<typeof insertHistoricoStockSchema>;
export type HistoricoStock = typeof historico_stock.$inferSelect;

// Comments table
export const comentarios = pgTable("comentarios", {
  id: serial("id").primaryKey(),
  book_id: integer("book_id").notNull(),
  user_id: integer("user_id").notNull(),
  content: text("content"),
  rating: integer("rating").notNull(),
  created_at: timestamp("created_at").defaultNow()
});

export const insertComentarioSchema = createInsertSchema(comentarios).pick({
  book_id: true,
  user_id: true,
  content: true,
  rating: true
}).extend({
    content: z.string()
      .min(5, { message: "El comentario debe tener al menos 5 caracteres" })
      .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,:;()'"!?-]+$/, {
        message: "El comentario contiene caracteres no permitidos"
      })
  });

export type InsertComentario = z.infer<typeof insertComentarioSchema>;
export type Comentario = typeof comentarios.$inferSelect;

// Reports table
export const reportes = pgTable("reportes", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  book_id: integer("book_id").notNull(),
  comment_id: integer("comment_id"),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow()
});

export const insertReporteSchema = createInsertSchema(reportes).pick({
  user_id: true,
  book_id: true,
  comment_id: true,
  description: true
});

export type InsertReporte = z.infer<typeof insertReporteSchema>;
export type Reporte = typeof reportes.$inferSelect;

// Loans table
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  book_id: integer("book_id").notNull(),
  start_date: date("start_date").notNull(),
  due_date: date("due_date").notNull(),
  status: varchar("status").notNull().default("prestado")
});

export const insertLoanSchema = createInsertSchema(loans).pick({
  user_id: true,
  book_id: true,
  start_date: true,
  due_date: true,
  status: true
});

export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loans.$inferSelect;

// Logs table
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  loan_id: integer("loan_id").notNull(),
  event_type: varchar("event_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertLogSchema = createInsertSchema(logs).pick({
  loan_id: true,
  event_type: true
});

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

// Auth schemas for frontend
const allowedDomains = ["gmail.com", "hotmail.com", "outlook.com"];

export const loginSchema = z.object({
  email: z.string()
    .email({ message: "Email inválido" })
    .refine((email) => {
      const domain = email.split("@")[1];
      return allowedDomains.includes(domain);
    }, {
      message: "Dominio de correo no permitido. Usa un dominio válido como gmail.com",
    }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

export type LoginData = z.infer<typeof loginSchema>;

// Función auxiliar para calcular edad
function calculateAge(birthDate: Date) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export const registerSchema = z.object({
  nombre: z.string()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
    .regex(/^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]+$/, { message: "El nombre solo puede contener letras y espacios" }),

  email: z.string()
    .email({ message: "Email inválido" })
    .refine((email) => {
      const domain = email.split("@")[1];
      return allowedDomains.includes(domain);
    }, {
      message: "Dominio de correo no permitido. Usa un dominio válido como gmail.com",
    }),

  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),

  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),

  birthDate: z.coerce.date({
    required_error: "La fecha de nacimiento es requerida",
    invalid_type_error: "La fecha de nacimiento debe ser una fecha válida"
  })
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
})
.refine((data) => {
  const age = calculateAge(data.birthDate);
  return age >= 5;
}, {
  message: "Debes tener al menos 5 años para registrarte",
  path: ["birthDate"]
});

export type RegisterData = z.infer<typeof registerSchema>;

// Extended types for front-end use
export type LibroWithStock = Libro & {
  availableCopies: number;
  totalCopies: number;
};

export type LibroWithRating = LibroWithStock & {
  averageRating: number;
  commentCount: number;
};

export type ComentarioWithUser = Comentario & {
  usuario: {
    nombre: string;
  };
};

export type LoanWithBookInfo = Loan & {
  libro: {
    id: number;
    titulo: string;
    autor: string;
    imagen_url: string;
  };
};
