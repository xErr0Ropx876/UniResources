import { z } from 'zod'

export const resourceUploadSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
    folder: z.string().min(1, 'Please select a folder'),
    tags: z.array(z.string()).min(1, 'At least one tag is required').max(10, 'Maximum 10 tags allowed'),
    featured: z.boolean().optional().default(false),
})

export const resourceUpdateSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(2000).optional(),
    folder: z.string().optional(),
    tags: z.array(z.string()).min(1).max(10).optional(),
    featured: z.boolean().optional(),
})

export const searchFiltersSchema = z.object({
    folder: z.string().optional(),
    tags: z.array(z.string()).optional(),
    search: z.string().optional(),
    sort: z.enum(['newest', 'views', 'enrollments']).optional().default('newest'),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(50).optional().default(12),
})

export const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

export type ResourceUploadInput = z.infer<typeof resourceUploadSchema>
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>
export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
