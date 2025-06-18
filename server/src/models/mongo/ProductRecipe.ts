import mongoose, { Document, Schema } from 'mongoose';

// Interface for recipe ingredient
export interface RecipeIngredient {
  inventoryItemId: number;
  quantity: number;
}

// Interface for product recipe document
export interface ProductRecipeDocument extends Document {
  productId: number;
  name: string;
  ingredients: RecipeIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

// Product recipe schema
const productRecipeSchema = new Schema<ProductRecipeDocument>(
  {
    productId: {
      type: Number,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    ingredients: [
      {
        inventoryItemId: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Create and export the model
export const ProductRecipe = mongoose.model<ProductRecipeDocument>('ProductRecipe', productRecipeSchema); 