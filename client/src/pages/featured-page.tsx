import React from "react";
import { useQuery } from "@tanstack/react-query";
import { LibroWithRating } from "@shared/schema";
import { BookGrid } from "@/components/book-grid";
import { Loader2, Star, BookMarked, TrendingUp } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { StarRating } from "@/components/ui/stars";

export default function FeaturedPage() {
  // Fetch featured books
  const { data: destacados = [], isLoading } = useQuery<LibroWithRating[]>({
    queryKey: ["/api/libros/destacados"],
  });
  
  // Fetch all books to create additional curated collections
  const { data: allBooks = [] } = useQuery<LibroWithRating[]>({
    queryKey: ["/api/libros"],
  });
  
  // Create curated collections from all books
  const romanticBooks = allBooks
    .filter(book => book.categoria === "Románticos")
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 5);
  
  const recentBooks = [...allBooks]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  
  // Find highest rated book
  const topRatedBook = destacados.length > 0 ? destacados[0] : null;

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Libros destacados</h1>
        
        {/* Hero section */}
        {topRatedBook && (
          <div className="mb-12 relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/90 to-primary">
            <div className="absolute inset-0 bg-cover bg-center opacity-20" 
              style={{backgroundImage: `url(${topRatedBook.imagen_url})`}}></div>
            <div className="relative z-10 flex flex-col md:flex-row gap-8 p-6 md:p-8">
              <div className="md:w-1/4 flex justify-center">
                <div className="h-64 w-44 overflow-hidden rounded-lg shadow-xl transform rotate-3 transition-transform hover:rotate-0">
                  <img 
                    src={topRatedBook.imagen_url} 
                    alt={`Portada de ${topRatedBook.titulo}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="md:w-3/4 text-white">
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-yellow-400 mr-2" />
                  <span className="text-sm uppercase tracking-wider font-medium">Libro mejor valorado</span>
                </div>
                <h2 className="text-3xl font-serif font-bold mb-2">{topRatedBook.titulo}</h2>
                <p className="text-lg mb-3">{topRatedBook.autor}</p>
                <div className="flex items-center mb-4">
                  <StarRating rating={topRatedBook.averageRating} size="md" className="text-yellow-400" />
                </div>
                <p className="text-white/80 mb-6 line-clamp-3">
                  {topRatedBook.description || "Una de las obras más destacadas de nuestra biblioteca."}
                </p>
                <a 
                  href={`/libro/${topRatedBook.id}`} 
                  className="inline-flex items-center px-4 py-2 bg-white text-primary rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                  <BookMarked className="mr-2 h-4 w-4" />
                  Ver detalle
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Featured books main section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span>Libros mejor valorados</span>
              </CardTitle>
              <CardDescription>
                Los libros con las mejores calificaciones de nuestros lectores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookGrid 
                books={destacados} 
                isLoading={isLoading}
                emptyMessage="No hay libros destacados disponibles en este momento."
              />
            </CardContent>
          </Card>
        </section>
        
        {/* Romantic books section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-5 w-5 text-pink-500"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                <span>Los más románticos</span>
              </CardTitle>
              <CardDescription>
                Selección de novelas románticas para los amantes del género
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookGrid 
                books={romanticBooks} 
                emptyMessage="No hay libros románticos disponibles en este momento."
              />
            </CardContent>
          </Card>
        </section>
        
        {/* Recent additions section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Añadidos recientemente</span>
              </CardTitle>
              <CardDescription>
                Las últimas incorporaciones a nuestra biblioteca
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookGrid 
                books={recentBooks} 
                emptyMessage="No hay libros nuevos disponibles en este momento."
              />
            </CardContent>
          </Card>
        </section>
        
        {/* Did you know section */}
        <section>
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle>¿Sabías que...?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-2">Nuestros lectores</h3>
                  <p className="text-gray-600 text-sm">
                    Los libros más solicitados en préstamo suelen ser los de categorías de romance y ficción histórica.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-2">Calificaciones</h3>
                  <p className="text-gray-600 text-sm">
                    El promedio general de calificaciones de nuestros libros es de 4.2 sobre 5 estrellas.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-2">Comentarios</h3>
                  <p className="text-gray-600 text-sm">
                    Los libros con más comentarios tienden a ser también los que tienen préstamos más frecuentes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
