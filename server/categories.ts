import { Request, Response } from "express";

export const getCategories = (req: Request, res: Response) => {
  const categorias = [
    "Ficción",
    "No Ficción",
    "Literatura Clásica",
    "Ciencia y Tecnología",
    "Infantil y Juvenil"
  ];

  res.json(categorias);
};