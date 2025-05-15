import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose 
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Menu,
  Search,
  User,
  LogOut,
  BookMarked,
  Settings,
  Bell,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Tipo para los resultados de búsqueda
interface SearchResults {
  libros: {
    id: number;
    titulo: string;
    autor: string;
    imagen_url: string;
    categoria: string;
    averageRating: number;
    commentCount: number;
  }[];
  categorias: {
    categoria: string;
    count: number;
  }[];
}

export const Header: React.FC = () => {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Buscar mientras se escribe con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults(null);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error al buscar:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalogo?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowResults(false);
    }
  };

  const handleResultClick = () => {
    setShowResults(false);
    setSearchTerm("");
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-sm relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-serif font-bold text-2xl text-primary ml-2">Booksy</span>
            </Link>
            
            {/* Desktop nav */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive("/") 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                Inicio
              </Link>
              <Link href="/catalogo" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive("/catalogo") || location.startsWith("/catalogo")
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                Catálogo
              </Link>
              <Link href="/destacados" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive("/destacados") 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                Destacados
              </Link>
              <Link href="/categorias" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive("/categorias") 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                Categorías
              </Link>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Search form */}
            <div className="relative mx-4">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Buscar libros..."
                  className="pl-10 pr-3 py-2 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.trim().length >= 2 && setShowResults(true)}
                />
              </form>
              
              {/* Dropdown de resultados de búsqueda */}
              {showResults && searchResults && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                  <div className="p-2 flex justify-between items-center border-b">
                    <span className="text-sm font-medium">Resultados de búsqueda</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => setShowResults(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {searchResults.categorias.length > 0 && (
                    <div className="p-2 border-b">
                      <h3 className="text-xs font-semibold text-gray-500 mb-2">CATEGORÍAS</h3>
                      <div className="space-y-1">
                        {searchResults.categorias.map((cat) => (
                          <Link
                            key={cat.categoria}
                            href={`/catalogo?categoria=${encodeURIComponent(cat.categoria)}`}
                            onClick={handleResultClick}
                            className="block p-2 hover:bg-gray-100 rounded-md"
                          >
                            <div className="flex items-center justify-between">
                              <span>{cat.categoria}</span>
                              <Badge variant="outline">{cat.count}</Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {searchResults.libros.length > 0 ? (
                    <div className="p-2">
                      <h3 className="text-xs font-semibold text-gray-500 mb-2">LIBROS</h3>
                      <div className="space-y-2">
                        {searchResults.libros.map((libro) => (
                          <Link
                            key={libro.id}
                            href={`/libro/${libro.id}`}
                            onClick={handleResultClick}
                            className="flex items-center p-2 hover:bg-gray-100 rounded-md"
                          >
                            {libro.imagen_url && (
                              <img
                                src={libro.imagen_url}
                                alt={libro.titulo}
                                className="h-12 w-9 object-cover rounded mr-3"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{libro.titulo}</p>
                              <p className="text-xs text-gray-500 truncate">{libro.autor}</p>
                              <div className="flex items-center mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {libro.categoria}
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No se encontraron resultados
                    </div>
                  )}
                  
                  <div className="p-2 border-t">
                    <Button 
                      variant="ghost" 
                      className="w-full text-primary text-sm" 
                      onClick={handleSearch}
                    >
                      Ver todos los resultados
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Auth buttons / User profile */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/prestamos">
                  <Button variant="ghost" size="icon" className="relative">
                    <BookMarked className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                      0
                    </Badge>
                  </Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center uppercase">
                        {user.nombre.charAt(0)}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/perfil" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/prestamos" className="cursor-pointer">
                        <BookMarked className="mr-2 h-4 w-4" />
                        <span>Mis Préstamos</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role_id === 2 && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Administración</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="outline" asChild>
                  <Link href="/auth">Iniciar sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth?tab=register">Registrarse</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col h-full">
                <div className="py-4">
                  <Link href="/" className="flex items-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span className="font-serif font-bold text-xl text-primary ml-2">Booksy</span>
                  </Link>
                </div>
                
                <div className="relative mb-6">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        placeholder="Buscar libros..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => searchTerm.trim().length >= 2 && setShowResults(true)}
                      />
                    </div>
                  </form>
                  
                  {/* Dropdown de resultados de búsqueda mobile */}
                  {showResults && searchResults && (
                    <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                      <div className="p-2 flex justify-between items-center border-b">
                        <span className="text-sm font-medium">Resultados</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => setShowResults(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {searchResults.categorias.length > 0 && (
                        <div className="p-2 border-b">
                          <h3 className="text-xs font-semibold text-gray-500 mb-2">CATEGORÍAS</h3>
                          <div className="space-y-1">
                            {searchResults.categorias.map((cat) => (
                              <SheetClose key={cat.categoria} asChild>
                                <Link
                                  href={`/catalogo?categoria=${encodeURIComponent(cat.categoria)}`}
                                  onClick={handleResultClick}
                                  className="block p-2 hover:bg-gray-100 rounded-md"
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{cat.categoria}</span>
                                    <Badge variant="outline">{cat.count}</Badge>
                                  </div>
                                </Link>
                              </SheetClose>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {searchResults.libros.length > 0 ? (
                        <div className="p-2">
                          <h3 className="text-xs font-semibold text-gray-500 mb-2">LIBROS</h3>
                          <div className="space-y-2">
                            {searchResults.libros.map((libro) => (
                              <SheetClose key={libro.id} asChild>
                                <Link
                                  href={`/libro/${libro.id}`}
                                  onClick={handleResultClick}
                                  className="flex items-center p-2 hover:bg-gray-100 rounded-md"
                                >
                                  {libro.imagen_url && (
                                    <img
                                      src={libro.imagen_url}
                                      alt={libro.titulo}
                                      className="h-12 w-9 object-cover rounded mr-3"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{libro.titulo}</p>
                                    <p className="text-xs text-gray-500 truncate">{libro.autor}</p>
                                  </div>
                                </Link>
                              </SheetClose>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No se encontraron resultados
                        </div>
                      )}
                      
                      <div className="p-2 border-t">
                        <SheetClose asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full text-primary text-sm" 
                            onClick={handleSearch}
                          >
                            Ver todos los resultados
                          </Button>
                        </SheetClose>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <SheetClose asChild>
                    <Button 
                      variant={isActive("/") ? "secondary" : "ghost"} 
                      className="w-full justify-start" 
                      asChild
                    >
                      <Link href="/">Inicio</Link>
                    </Button>
                  </SheetClose>
                  
                  <SheetClose asChild>
                    <Button 
                      variant={isActive("/catalogo") || location.startsWith("/catalogo") ? "secondary" : "ghost"} 
                      className="w-full justify-start" 
                      asChild
                    >
                      <Link href="/catalogo">Catálogo</Link>
                    </Button>
                  </SheetClose>
                  
                  <SheetClose asChild>
                    <Button 
                      variant={isActive("/destacados") ? "secondary" : "ghost"} 
                      className="w-full justify-start" 
                      asChild
                    >
                      <Link href="/destacados">Destacados</Link>
                    </Button>
                  </SheetClose>
                  
                  <SheetClose asChild>
                    <Button 
                      variant={isActive("/categorias") ? "secondary" : "ghost"} 
                      className="w-full justify-start" 
                      asChild
                    >
                      <Link href="/categorias">Categorías</Link>
                    </Button>
                  </SheetClose>
                </div>
                
                <div className="border-t border-gray-200 mt-6 pt-6">
                  {user ? (
                    <div className="space-y-3">
                      {/* Contenido para usuarios autenticados en mobile */}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Contenido para usuarios no autenticados en mobile */}
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};