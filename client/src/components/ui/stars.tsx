import React from "react";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
  isInteractive?: boolean;
  onRatingChange?: (value: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = "md",
  showValue = true,
  className,
  isInteractive = false,
  onRatingChange
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);
  
  const sizeStyles = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg"
  };

  const starSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const renderStar = (index: number) => {
    // For interactive mode, use hover or rating based on hover state
    const value = isInteractive ? (hoverRating || rating) : rating;
    
    const fillStar = () => {
      if (index <= Math.floor(value)) {
        return "fill-yellow-400 text-yellow-400";
      } else if (index === Math.ceil(value) && value % 1 !== 0) {
        return "text-yellow-400"; // For half stars, we use different component
      } else {
        return "text-gray-300";
      }
    };

    const isHalfStar = index === Math.ceil(value) && value % 1 !== 0;

    const starProps = {
      className: cn(fillStar()),
      size: starSizes[size]
    };

    if (isInteractive) {
      return (
        <span 
          key={index}
          className="cursor-pointer"
          onMouseEnter={() => setHoverRating(index)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => onRatingChange?.(index)}
        >
          {isHalfStar ? <StarHalf {...starProps} /> : <Star {...starProps} />}
        </span>
      );
    }

    return isHalfStar ? <StarHalf key={index} {...starProps} /> : <Star key={index} {...starProps} />;
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map(renderStar)}
      </div>
      {showValue && (
        <span className={cn("ml-1 text-gray-500", sizeStyles[size])}>
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};
