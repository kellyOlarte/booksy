import React from "react";
import { Link } from "wouter";
import { LibroWithRating } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/stars";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { CalendarIcon } from "lucide-react";

interface BookCardProps {
  book: LibroWithRating;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const getAvailabilityStatus = () => {
    if (book.availableCopies <= 0) return "no-disponible";
    if (book.availableCopies <= 5) return "pocos";
    return "disponible";
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full transition-shadow duration-300 hover:shadow-md">
      <div className="relative h-56 overflow-hidden">
        <img 
          src={book.imagen_url} 
          alt={`Portada de ${book.titulo}`}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="flex-grow pt-4">
        <h3 className="text-lg font-semibold line-clamp-1 font-serif mb-1">{book.titulo}</h3>
        <p className="text-sm text-muted-foreground mb-2">{book.autor}</p>
        
        <div className="flex items-center mb-3">
          <StarRating rating={book.averageRating} size="sm" />
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            <span>Año: {book.published_year}</span>
          </div>
          <span className="text-xs">
            {book.availableCopies}/{book.totalCopies} disponibles
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between items-center">
        <AvailabilityBadge 
          status={getAvailabilityStatus()} 
          count={book.availableCopies > 0 && book.availableCopies <= 5 ? book.availableCopies : undefined}
        />
        
        <Button 
          variant="default" 
          size="sm" 
          asChild
        >
          <Link href={`/libro/${book.id}`}>Ver detalle</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
