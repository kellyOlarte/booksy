import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryCard } from "@/components/category-card";
import { Loader2 } from "lucide-react";

export default function CategoriesPage() {
  // Fetch categories with book counts
  const { data: categorias = [], isLoading } = useQuery<{categoria: string, count: number}[]>({
    queryKey: ["/api/categorias"],
  });

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Explora por categorías</h1>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">No hay categorías disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categorias.map((categoria) => (
                <CategoryCard 
                  key={categoria.categoria} 
                  categoria={categoria.categoria} 
                  count={categoria.count} 
                  className="h-full"
                />
              ))}
            </div>
          )}
          
          <div className="mt-16 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">¿Qué tipo de lecturas prefieres?</h2>
            
            <p className="text-gray-600 mb-6">
              En Booksy, organizamos nuestra biblioteca en diferentes categorías para que puedas 
              encontrar fácilmente los libros que más te interesan. Explora géneros clásicos 
              y descubre nuevas lecturas que tal vez no conocías.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-2">Románticos</h3>
                <p className="text-gray-600 text-sm">
                  Desde historias de amor clásicas hasta romances contemporáneos, encuentra las mejores 
                  novelas románticas para emocionarte y soñar.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-2">Ciencia Ficción</h3>
                <p className="text-gray-600 text-sm">
                  Viaja a otros mundos, explora futuros alternativos y descubre tecnologías 
                  asombrosas en nuestra colección de ciencia ficción.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-2">Clásicos</h3>
                <p className="text-gray-600 text-sm">
                  Las obras más importantes de la literatura universal que han resistido el paso 
                  del tiempo y continúan cautivando lectores.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-2">Terror</h3>
                <p className="text-gray-600 text-sm">
                  Prepárate para sentir escalofríos con nuestra selección de historias de terror, 
                  misterio y suspenso que te mantendrán en vilo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
