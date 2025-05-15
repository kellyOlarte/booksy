import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LibroWithRating, ComentarioWithUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { StarRating } from "@/components/ui/stars";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, BookOpen, ChevronLeft, MessageSquare, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function BookDetailPage() {
  const [_, params] = useRoute("/libro/:id");
  const bookId = params ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State
  const [loanDuration, setLoanDuration] = useState<number>(30);
  const [userRating, setUserRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  
  // Fetch book data
  const { data: book, isLoading } = useQuery<LibroWithRating>({
    queryKey: [`/api/libros/${bookId}`],
    enabled: !!bookId,
  });
  
  // Fetch book comments
  const { data: comments = [], isLoading: isLoadingComments } = useQuery<ComentarioWithUser[]>({
    queryKey: [`/api/libros/${bookId}/comentarios`],
    enabled: !!bookId,
  });
  
  // Check if user has already commented on this book
  const hasUserCommented = user && comments.some(comment => comment.user_id === user.id);
  
  // Function to determine availability status
  const getAvailabilityStatus = () => {
    if (!book) return "no-disponible";
    if (book.availableCopies <= 0) return "no-disponible";
    if (book.availableCopies <= 5) return "pocos";
    return "disponible";
  };
  
  // Create loan mutation
  const loanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/prestamos", {
        book_id: bookId,
        dias: loanDuration
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Préstamo realizado!",
        description: `Has solicitado "${book?.titulo}" por ${loanDuration} días. Ya está disponible para recogerlo en la biblioteca 📖`,
      });
      // Refetch book data to update availability
      queryClient.invalidateQueries({ queryKey: [`/api/libros/${bookId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al realizar préstamo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create comment and rating mutation
  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/libros/${bookId}/comentarios`, {
        content: comment,
        rating: userRating
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Comentario enviado!",
        description: "Tu comentario y calificación han sido registrados.",
      });
      // Reset form
      setComment("");
      setUserRating(0);
      // Refetch comments
      queryClient.invalidateQueries({ queryKey: [`/api/libros/${bookId}/comentarios`] });
      // Refetch book to update rating
      queryClient.invalidateQueries({ queryKey: [`/api/libros/${bookId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar comentario",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle loan submission
  const handleLoanSubmit = () => {
    if (!user) {
      toast({
        title: "Inicia sesión para continuar",
        description: "Debes iniciar sesión para solicitar préstamos.",
        variant: "destructive",
      });
      return;
    }
    
    loanMutation.mutate();
  };
  
  // Handle comment submission
  const handleCommentSubmit = () => {

  const specialCharsRegex = /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ.,;:¡!¿?\s]/;

  if (specialCharsRegex.test(comment)) {
    toast({
      title: "Comentario no válido",
      description: "No se permiten caracteres especiales en el comentario.",
      variant: "destructive",
    });
    return;
  }

    if (!userRating) {
      toast({
        title: "Calificación requerida",
        description: "Por favor selecciona una calificación para el libro.",
        variant: "destructive",
      });
      return;
    }
    
    commentMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold mb-4">Libro no encontrado</h1>
            <p className="text-gray-500 mb-6">El libro que buscas no existe o ha sido eliminado.</p>
            <Button asChild>
              <Link href="/catalogo">Volver al catálogo</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/catalogo" className="flex items-center text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" /> Volver al catálogo
            </Link>
          </Button>
        </div>
        
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Book cover and basic info */}
              <div className="w-full md:w-1/3 p-6 bg-gray-50">
                <div className="aspect-[2/3] overflow-hidden rounded-lg mb-6">
                  <img 
                    src={book.imagen_url} 
                    alt={`Portada de ${book.titulo}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h6 className="text-sm text-gray-500 mb-1">Calificación promedio</h6>
                    <div className="flex items-center">
                      <StarRating rating={book.averageRating} size="md" />
                      <span className="ml-2 text-sm text-gray-500">
                        ({book.commentCount} {book.commentCount === 1 ? 'calificación' : 'calificaciones'})
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h6 className="text-sm text-gray-500 mb-1">Autor</h6>
                    <p className="font-medium">{book.autor}</p>
                  </div>
                  
                  <div>
                    <h6 className="text-sm text-gray-500 mb-1">Año de publicación</h6>
                    <p className="font-medium">{book.published_year || "Desconocido"}</p>
                  </div>
                  
                  <div>
                    <h6 className="text-sm text-gray-500 mb-1">Categoría</h6>
                    <Badge variant="outline" className="bg-primary/10">
                      {book.categoria}
                    </Badge>
                  </div>
                  
                  <div>
                    <h6 className="text-sm text-gray-500 mb-1">Disponibilidad</h6>
                    <div className="flex items-center justify-between">
                      <AvailabilityBadge status={getAvailabilityStatus()} />
                      <span className="text-sm text-gray-500">
                        {book.availableCopies}/{book.totalCopies} disponibles
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Book details */}
              <div className="w-full md:w-2/3 p-6 md:border-l border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900 mb-3 font-serif">{book.titulo}</h1>
                
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Descripción</h2>
                  <p className="text-gray-600">
                    {book.description || "No hay descripción disponible para este libro."}
                  </p>
                </div>
                
                {/* Login prompt for non-authenticated users */}
                {!user && (
                  <Card className="mb-6 bg-gray-50 border-primary/20">
                    <CardContent className="pt-6">
                      <p className="text-gray-600 mb-4">
                        Para solicitar un préstamo, calificar o comentar este libro, debes iniciar sesión.
                      </p>
                      <div className="flex space-x-3">
                        <Button asChild>
                          <Link href="/auth">Iniciar Sesión</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/auth?tab=register">Registrarse</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Loan request form for authenticated users */}
                {user && book.availableCopies > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center">
                        <BookOpen className="mr-2 h-5 w-5" /> Solicitar préstamo
                      </CardTitle>
                      <CardDescription>
                        Selecciona la duración del préstamo (máximo 90 días)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <Slider
                            min={7}
                            max={90}
                            step={1}
                            value={[loanDuration]}
                            onValueChange={(value) => setLoanDuration(value[0])}
                          />
                          <span className="font-medium min-w-[80px] text-center">
                            {loanDuration} días
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>7 días</span>
                          <span>90 días</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={handleLoanSubmit}
                        disabled={loanMutation.isPending}
                      >
                        {loanMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Solicitar préstamo
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )}
                
                {/* Unavailable notice */}
                {user && book.availableCopies <= 0 && (
                  <Card className="mb-6 bg-red-50 border-red-200">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium text-red-800 mb-2">Libro no disponible</h3>
                      <p className="text-red-600">
                        Actualmente no hay copias disponibles de este libro. Por favor intenta más tarde.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Rating and comment section for authenticated users */}
                {user && !hasUserCommented && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center">
                        <MessageSquare className="mr-2 h-5 w-5" /> Califica y comenta
                      </CardTitle>
                      <CardDescription>
                        Comparte tu opinión sobre este libro
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Tu calificación</h3>
                        <div className="flex justify-center mb-2">
                          <StarRating 
                            rating={userRating} 
                            size="lg" 
                            showValue={false}
                            isInteractive
                            onRatingChange={setUserRating}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Tu comentario</h3>
                        <Textarea
                          placeholder="Comparte tu opinión sobre este libro..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          El comentario es opcional, pero la calificación es obligatoria.
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={handleCommentSubmit}
                        disabled={commentMutation.isPending || userRating === 0}
                      >
                        {commentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          "Enviar valoración"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )}
                
                {/* Already commented notice */}
                {user && hasUserCommented && (
                  <div className="p-4 mb-6 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 flex items-center">
                      <span className="mr-2">✓</span>
                      Ya has valorado este libro. ¡Gracias por compartir tu opinión!
                    </p>
                  </div>
                )}
                
                {/* Comments section */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Comentarios de lectores
                  </h2>
                  
                  {isLoadingComments ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="py-8 text-center border border-gray-200 rounded-lg">
                      <p className="text-gray-500">
                        Aún no hay comentarios para este libro. ¡Sé el primero en opinar!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <Card key={comment.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback className="bg-primary text-white">
                                    {comment.usuario.nombre.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium text-sm">
                                    {comment.usuario.nombre}
                                  </h4>
                                  <StarRating rating={comment.rating} size="sm" showValue={false} />
                                </div>
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {format(new Date(comment.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                                </span>
                              </div>
                            </div>
                            {comment.content ? (
                              <p className="text-gray-600 text-sm">{comment.content}</p>
                            ) : (
                              <p className="text-gray-400 text-sm italic">
                                Este usuario solo calificó el libro.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
