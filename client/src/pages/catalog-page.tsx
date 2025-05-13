import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { LibroWithRating } from "@shared/schema";
import { BookGrid } from "@/components/book-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { StarRating } from "@/components/ui/stars";
import { Separator } from "@/components/ui/separator";
import { BookOpen, LayoutGrid, List, Check, RefreshCw } from "lucide-react";

export default function CatalogPage() {
  // Get URL parameters
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const initialCategory = searchParams.get("categoria") || "todas";
  const initialSearchTerm = searchParams.get("search") || "";
  
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number[]>([]);
  const [yearFilter, setYearFilter] = useState<number[]>([1600, new Date().getFullYear()]);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Get categories
  const { data: categorias = [] } = useQuery<{categoria: string, count: number}[]>({
    queryKey: ["/api/categorias"],
  });
  
  // Get books with filters
  const { data: books = [], isLoading } = useQuery<LibroWithRating[]>({
    queryKey: [
      "/api/libros", 
      selectedCategory === "todas" ? undefined : selectedCategory, 
      searchTerm
    ],
  });
  
  // Apply client-side filters
  const filteredBooks = books.filter(book => {

    //Filtro por categoría
    if (selectedCategory !== "todas" && book.categoria !== selectedCategory) {
    return false;
  }
    // Filter by availability
    if (availableOnly && book.availableCopies <= 0) {
      return false;
    }
    
    // Filter by rating
    if (minRating.length > 0 && !minRating.includes(book.averageRating)) {
      return false;
    }
    
    // Filter by year
    if (book.published_year && (book.published_year < yearFilter[0] || book.published_year > yearFilter[1])) {
      return false;
    }
    
    return true;
  });
  
  // Apply sorting
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.averageRating - a.averageRating;
      case "title-asc":
        return a.titulo.localeCompare(b.titulo);
      case "title-desc":
        return b.titulo.localeCompare(a.titulo);
      case "year-desc":
        return (b.published_year || 0) - (a.published_year || 0);
      case "year-asc":
        return (a.published_year || 0) - (b.published_year || 0);
      default: // recent
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
  
  // Reset filters
  const resetFilters = () => {
    setSelectedCategory("todas");
    setSearchTerm("");
    setAvailableOnly(false);
    setMinRating([]);
    setYearFilter([1600, new Date().getFullYear()]);
    setSortBy("recent");
  };
  
  // Update URL when category changes (for shareable links)
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedCategory !== "todas") {
      params.set("categoria", selectedCategory);
    }
    
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    
    const newUrl = params.toString() ? `/catalogo?${params.toString()}` : "/catalogo";
    window.history.replaceState(null, "", newUrl);
  }, [selectedCategory, searchTerm]);

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar filters */}
          <div className="w-full md:w-64 flex-shrink-0">
            <Card className="sticky top-4">
              <CardContent className="p-4">
                <h2 className="font-medium text-lg mb-4 font-serif">Filtros</h2>
                
                <div className="space-y-6">
                  {/* Categories filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Categorías</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cat-all" 
                          checked={selectedCategory === "todas"} 
                          onCheckedChange={() => setSelectedCategory("todas")}
                        />
                        <Label htmlFor="cat-all" className="text-sm">Todas las categorías</Label>
                      </div>
                      
                      {categorias.map((categoria) => (
                        <div key={categoria.categoria} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`cat-${categoria.categoria}`} 
                            checked={selectedCategory === categoria.categoria}
                            onCheckedChange={() => setSelectedCategory(categoria.categoria)}
                          />
                          <Label htmlFor={`cat-${categoria.categoria}`} className="text-sm">
                            {categoria.categoria} ({categoria.count})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Rating filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Valoración</h3>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`rating-${rating}`}
                            checked={minRating.includes(rating)}
                            onCheckedChange={() => setMinRating(prev =>
                                prev.includes(rating) 
                                  ? prev.filter(r => r !== rating)  
                                  : [...prev, rating]               
                              )
                            }
                          />
                          <Label htmlFor={`rating-${rating}`} className="text-sm flex items-center">
                            <StarRating rating={rating} showValue={false} size="sm" />
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Availability filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Disponibilidad</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="available" 
                        checked={availableOnly}
                        onCheckedChange={(checked) => setAvailableOnly(!!checked)}
                      />
                      <Label htmlFor="available" className="text-sm">Solo disponibles</Label>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Year filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Año de publicación</h3>
                    <div className="px-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500">{yearFilter[0]}</span>
                        <span className="text-xs text-gray-500">{yearFilter[1]}</span>
                      </div>
                      <Slider
                        defaultValue={yearFilter}
                        min={1900}
                        max={new Date().getFullYear()}
                        step={1}
                        onValueChange={(value) => setYearFilter(value as number[])}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center"
                    onClick={resetFilters}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Limpiar filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-2xl font-serif font-bold text-gray-900">Catálogo de libros</h1>
              
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Más recientes</SelectItem>
                    <SelectItem value="rating">Mejor valorados</SelectItem>
                    <SelectItem value="title-asc">Título: A-Z</SelectItem>
                    <SelectItem value="title-desc">Título: Z-A</SelectItem>
                    <SelectItem value="year-desc">Año: Reciente a antiguo</SelectItem>
                    <SelectItem value="year-asc">Año: Antiguo a reciente</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="hidden sm:flex space-x-2">
                  <Button
                    size="icon"
                    variant={viewMode === "grid" ? "default" : "outline"}
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Search summary */}
            {(searchTerm || selectedCategory !== "todas" || availableOnly || minRating > []) && (
              <div className="bg-gray-100 p-3 rounded-lg mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  <span className="text-sm">
                    Mostrando {sortedBooks.length} resultado{sortedBooks.length !== 1 ? 's' : ''} 
                    {searchTerm && <span> para "<strong>{searchTerm}</strong>"</span>}
                    {selectedCategory !== "todas" && <span> en <strong>{selectedCategory}</strong></span>}
                    {availableOnly && <span> <strong>disponibles</strong></span>}
                    {minRating > [] && <span> con <strong>{minRating}+ estrellas</strong></span>}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RefreshCw className="mr-1 h-3 w-3" /> Limpiar
                </Button>
              </div>
            )}
            
            {/* Books grid */}
            <BookGrid 
              books={sortedBooks}
              isLoading={isLoading} 
              emptyMessage={
                searchTerm || selectedCategory !== "todas" || availableOnly || minRating > []
                  ? "No hay libros que coincidan con los filtros aplicados."
                  : "No hay libros disponibles en el catálogo."
              }
            />
            
            {/* Pagination - For future implementation */}
            {sortedBooks.length > 0 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="hidden sm:block text-sm text-gray-700">
                  Mostrando <span className="font-medium">{sortedBooks.length}</span> resultados
                </div>
                {/* Pagination would go here in a future implementation */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
