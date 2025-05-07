import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Heart, 
  Lightbulb, 
  History, 
  Glasses,
  Skull,
  BookA,
  Orbit,
  Award
} from "lucide-react";

interface CategoryCardProps {
  categoria: string;
  count: number;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ 
  categoria, 
  count,
  className
}) => {
  const getCategoryConfig = (categoria: string) => {
    const config = {
      Románticos: {
        icon: Heart,
        color: "text-pink-600 bg-pink-100",
      },
      Clásicos: {
        icon: BookA,
        color: "text-indigo-600 bg-indigo-100",
      },
      Ciencia: {
        icon: Lightbulb,
        color: "text-green-600 bg-green-100",
      },
      "Ciencia Ficción": {
        icon: Orbit,
        color: "text-blue-600 bg-blue-100",
      },
      Históricos: {
        icon: History,
        color: "text-amber-600 bg-amber-100",
      },
      Misterio: {
        icon: Glasses,
        color: "text-yellow-600 bg-yellow-100",
      },
      Terror: {
        icon: Skull,
        color: "text-red-600 bg-red-100",
      },
      Poesía: {
        icon: Award,
        color: "text-purple-600 bg-purple-100",
      },
      default: {
        icon: BookOpen,
        color: "text-primary bg-primary/10",
      },
    };

    return config[categoria as keyof typeof config] || config.default;
  };

  const { icon: Icon, color } = getCategoryConfig(categoria);

  return (
    <Link href={`/catalogo?categoria=${encodeURIComponent(categoria)}`}>
      <Card className={cn(
        "hover:bg-gray-50 transition-colors duration-200 cursor-pointer",
        className
      )}>
        <CardContent className="flex flex-col items-center py-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mb-3",
            color
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="font-medium text-center text-primary line-clamp-1">{categoria}</span>
          <span className="text-xs text-muted-foreground">({count} libros)</span>
        </CardContent>
      </Card>
    </Link>
  );
};
