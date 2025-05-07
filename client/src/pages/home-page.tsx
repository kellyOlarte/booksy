import React from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookGrid } from "@/components/book-grid";
import { CategoryCard } from "@/components/category-card";
import { LibroWithRating } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  
  // Fetch featured books
  const { data: destacados = [], isLoading: isLoadingDestacados } = useQuery<LibroWithRating[]>({
    queryKey: ["/api/libros/destacados"],
  });
  
  // Fetch categories
  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery<{categoria: string, count: number}[]>({
    queryKey: ["/api/categorias"],
  });

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-primary py-12 md:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"}}></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 text-white mb-8 md:mb-0">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
                Descubre mundos infinitos<br />en nuestra biblioteca
              </h1>
              <p className="text-lg mb-6 text-white/90 max-w-2xl">
                En Booksy encontrarás los mejores libros para leer. Pide prestado, comenta y comparte tus lecturas favoritas.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/catalogo">Explorar catálogo</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
                  <Link href={user ? "/destacados" : "/auth"}>{user ? "Ver destacados" : "Iniciar sesión"}</Link>
                </Button>
              </div>
            </div>
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative h-80 w-80">
                <div className="absolute top-0 left-0 transform -rotate-6 shadow-xl">
                  <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400" alt="Portada de libro" className="w-48 h-64 object-cover rounded-md" />
                </div>
                <div className="absolute top-10 left-20 transform rotate-3 shadow-xl z-10">
                  <img src="https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400" alt="Portada de libro" className="w-48 h-64 object-cover rounded-md" />
                </div>
                <div className="absolute top-20 left-40 transform -rotate-3 shadow-xl z-20">
                  <img src="https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400" alt="Portada de libro" className="w-48 h-64 object-cover rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Destacados</h2>
            <Link href="/destacados" className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
              Ver todos <BookOpen className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <BookGrid 
            books={destacados} 
            isLoading={isLoadingDestacados}
            emptyMessage="No hay libros destacados disponibles en este momento."
          />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">Explora por categorías</h2>
            <Link href="/categorias" className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
              Ver todas <BookOpen className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {isLoadingCategorias ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categorias.slice(0, 6).map((categoria) => (
                <CategoryCard 
                  key={categoria.categoria} 
                  categoria={categoria.categoria} 
                  count={categoria.count} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">Nuestros lectores dicen</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-primary">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-3">
                  <span>M</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">María López</h3>
                  <div className="flex text-yellow-400 text-sm">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Booksy ha cambiado mi forma de leer. El sistema de préstamos es muy cómodo y el catálogo es impresionante. ¡Muy recomendable!</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-primary">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-3">
                  <span>J</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Juan Rodríguez</h3>
                  <div className="flex text-yellow-400 text-sm">
                    {[...Array(4)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                    <svg className="w-4 h-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">Me encanta poder comentar y calificar los libros que leo. Es una comunidad muy activa y he descubierto muchos títulos nuevos gracias a las recomendaciones.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-primary">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-3">
                  <span>L</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Laura Martínez</h3>
                  <div className="flex text-yellow-400 text-sm">
                    {[...Array(4)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                    <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor" fillOpacity="0.5" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">La sección de destacados me ayuda a estar siempre al día con los mejores títulos. La interfaz es muy intuitiva y el servicio de préstamo funciona perfectamente.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
