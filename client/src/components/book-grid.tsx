import React from "react";
import { LibroWithRating } from "@shared/schema";
import { BookCard } from "@/components/book-card";
import { Loader2 } from "lucide-react";

interface BookGridProps {
  books: LibroWithRating[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export const BookGrid: React.FC<BookGridProps> = ({ 
  books, 
  isLoading = false,
  emptyMessage = "No hay libros disponibles" 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex justify-center items-center py-16">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {books.map(book => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};
