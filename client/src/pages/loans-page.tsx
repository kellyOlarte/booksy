import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LoanWithBookInfo } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Loader2, Calendar, Clock, BookOpen, ArrowRight } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export default function LoansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loanToReturn, setLoanToReturn] = useState<LoanWithBookInfo | null>(null);
  
  // Fetch user's active loans
  const { data: activeLoans = [], isLoading: isLoadingActive } = useQuery<LoanWithBookInfo[]>({
    queryKey: ["/api/prestamos"],
    enabled: !!user
  });
  
  // Fetch user's loan history
  const { data: loanHistory = [], isLoading: isLoadingHistory } = useQuery<LoanWithBookInfo[]>({
    queryKey: ["/api/prestamos/historial"],
    enabled: !!user
  });
  
  // Return book mutation
  const returnMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/prestamos/${id}/devolver`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Libro devuelto",
        description: "Has devuelto el libro correctamente",
      });
      setLoanToReturn(null);
      // Refetch loans data
      queryClient.invalidateQueries({ queryKey: ["/api/prestamos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prestamos/historial"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al devolver libro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Helper to get status badges
  const getStatusBadge = (loan: LoanWithBookInfo) => {
    const dueDate = new Date(loan.due_date);
    const today = new Date();
    
    if (isPast(dueDate)) {
      const daysLate = differenceInDays(today, dueDate);
      return (
        <Badge variant="destructive" className="px-2 py-1">
          Vencido ({daysLate} {daysLate === 1 ? 'día' : 'días'})
        </Badge>
      );
    }
    
    const daysLeft = differenceInDays(dueDate, today);
    if (daysLeft <= 5) {
      return (
        <Badge variant="warning" className="px-2 py-1">
          Próximo a vencer ({daysLeft} {daysLeft === 1 ? 'día' : 'días'})
        </Badge>
      );
    }
    
    return (
      <Badge variant="success" className="px-2 py-1">
        Activo
      </Badge>
    );
  };
  
  // Handle return book
  const handleReturnBook = () => {
    if (loanToReturn) {
      returnMutation.mutate(loanToReturn.id);
    }
  };

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Mis préstamos</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Gestión de préstamos</CardTitle>
              <CardDescription>
                Administra tus préstamos activos y consulta tu historial de préstamos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="w-full border-b rounded-none border-b-border flex justify-start p-0 h-auto">
                  <TabsTrigger 
                    value="active" 
                    className="py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
                  >
                    Préstamos activos ({activeLoans.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
                  >
                    Historial ({loanHistory.length})
                  </TabsTrigger>
                </TabsList>
                
                {/* Active Loans Tab */}
                <TabsContent value="active" className="p-6">
                  {isLoadingActive ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : activeLoans.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        No tienes préstamos activos
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Explora nuestro catálogo y encuentra tu próxima lectura favorita.
                      </p>
                      <Button asChild>
                        <Link href="/catalogo">
                          <BookOpen className="mr-2 h-4 w-4" /> Explorar catálogo
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {activeLoans.map((loan) => (
                        <Card key={loan.id} className="overflow-hidden flex flex-col">
                          <div className="flex flex-col sm:flex-row">
                            <div className="sm:w-1/3 h-auto">
                              <div className="h-48 sm:h-full w-full">
                                <img 
                                  src={loan.libro.imagen_url}
                                  alt={`Portada de ${loan.libro.titulo}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            <div className="sm:w-2/3 p-5">
                              <h3 className="text-lg font-bold mb-1 line-clamp-1">
                                {loan.libro.titulo}
                              </h3>
                              <p className="text-sm text-gray-500 mb-3">{loan.libro.autor}</p>
                              
                              <div className="mb-4">
                                {getStatusBadge(loan)}
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Fecha de préstamo:
                                  </span>
                                  <span className="font-medium">
                                    {format(new Date(loan.start_date), "d MMM yyyy", { locale: es })}
                                  </span>
                                </div>
                                
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Fecha de vencimiento:
                                  </span>
                                  <span className="font-medium">
                                    {format(new Date(loan.due_date), "d MMM yyyy", { locale: es })}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-4 space-x-2 flex">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  asChild
                                >
                                  <Link href={`/libro/${loan.book_id}`}>
                                    Ver libro
                                  </Link>
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => setLoanToReturn(loan)}
                                >
                                  Devolver
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                {/* History Tab */}
                <TabsContent value="history" className="p-6">
                  {isLoadingHistory ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : loanHistory.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                      <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        No tienes historial de préstamos
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Aquí aparecerán los libros que hayas devuelto.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {loanHistory.map((loan) => (
                        <Card key={loan.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="hidden sm:block w-16 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                <img 
                                  src={loan.libro.imagen_url}
                                  alt={loan.libro.titulo}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-grow">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                  <h3 className="font-medium">{loan.libro.titulo}</h3>
                                  <Badge variant="outline" className="w-fit">Devuelto</Badge>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{loan.libro.autor}</p>
                                <div className="flex flex-col sm:flex-row justify-between mt-2 text-sm text-gray-500">
                                  <span>
                                    Prestado: {format(new Date(loan.start_date), "d MMM yyyy", { locale: es })}
                                  </span>
                                  <span className="flex items-center mt-1 sm:mt-0">
                                    <ArrowRight className="h-3 w-3 mx-1 hidden sm:inline" />
                                    Devuelto: {format(new Date(loan.due_date), "d MMM yyyy", { locale: es })}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-auto pl-4 flex-shrink-0 self-center hidden sm:block">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/libro/${loan.book_id}`}>
                                    Ver libro
                                  </Link>
                                </Button>
                              </div>
                            </div>
                            <div className="mt-4 sm:hidden">
                              <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href={`/libro/${loan.book_id}`}>
                                  Ver libro
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card className="bg-primary-50">
            <CardHeader>
              <CardTitle>Información de préstamos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-2">Duración de préstamos</h3>
                  <p className="text-gray-600 text-sm">
                    Puedes solicitar préstamos por un período de 7 a 90 días. Recuerda devolver tus libros a tiempo.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-2">Límite de préstamos</h3>
                  <p className="text-gray-600 text-sm">
                    Cada usuario puede tener un máximo de 5 préstamos activos simultáneamente.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-2">Devoluciones</h3>
                  <p className="text-gray-600 text-sm">
                    Puedes devolver los libros en cualquier momento antes de la fecha de vencimiento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Return Book Confirmation Dialog */}
      <AlertDialog 
        open={!!loanToReturn} 
        onOpenChange={(open) => !open && setLoanToReturn(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Devolver libro</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas devolver el libro <strong>{loanToReturn?.libro.titulo}</strong>?
              Una vez devuelto, el libro estará disponible para otros usuarios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReturnBook}
              disabled={returnMutation.isPending}
            >
              {returnMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar devolución"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
