// UI Components
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./ui/Button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
  type CardVariant,
} from "./ui/Card";
export { Badge, type BadgeProps, type BadgeVariant, type AIConfidenceLevel } from "./ui/Badge";
export { DisclaimerBanner, type DisclaimerBannerProps } from "./ui/DisclaimerBanner";

// Layout Components
export { Container, type ContainerProps } from "./layout/Container";
export { Header, type HeaderProps } from "./layout/Header";
export { BottomNav, type BottomNavProps } from "./layout/BottomNav";

// Dashboard Components
export { CalorieHeroCard, type CalorieHeroCardProps } from "./dashboard/CalorieHeroCard";
export { MacroDistribution, type MacroDistributionProps } from "./dashboard/MacroDistribution";
export { QuickMetrics, type QuickMetricsProps } from "./dashboard/QuickMetrics";
export { MealSection, type MealSectionProps } from "./dashboard/MealSection";
export { ActivitySummaryCard, type ActivitySummaryCardProps } from "./dashboard/ActivitySummaryCard";

// Meal & AI Analysis Components
export { ImageUploader, type ImageUploaderProps } from "./meal/ImageUploader";
export { AnalysisLoadingState, type AnalysisLoadingStateProps } from "./meal/AnalysisLoadingState";
export { MealItemRow, type MealItemRowProps } from "./meal/MealItemRow";
export { NutritionSummaryCard, type NutritionSummaryCardProps } from "./meal/NutritionSummaryCard";
export { AddFoodItemModal, type AddFoodItemModalProps } from "./meal/AddFoodItemModal";
