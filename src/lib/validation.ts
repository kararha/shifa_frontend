import { z } from 'zod';

// Iraqi mobile number validation
const iraqiPhoneSchema = z.string()
  .regex(
    /^(078\d{8})$/,  // Exactly 11 digits, starting with 078
    { message: "Invalid Iraqi mobile number" }
  );

export const baseUserSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .max(100, 'Email must be less than 100 characters'),
    
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(50, 'Password must be less than 50 characters')
        .regex(
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, 
            'Password must contain letters, numbers, and special characters'
        ),
    
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters')
        .regex(/^[A-Za-z\s]+$/, 'Name can only contain letters and spaces'),
    
    role: z.enum(['doctor', 'patient', 'home_care_provider', 'admin'], {
        errorMap: () => ({ message: 'Invalid role selected' })
    })
});

export const patientSchema = baseUserSchema.extend({
    dateOfBirth: z.string().refine(
        (date) => {
            const parsedDate = new Date(date);
            const minAge = new Date();
            minAge.setFullYear(minAge.getFullYear() - 120);
            const maxAge = new Date();
            maxAge.setFullYear(maxAge.getFullYear() - 0);
            
            return !isNaN(parsedDate.getTime()) && 
                   parsedDate <= maxAge && 
                   parsedDate >= minAge;
        }, 
        { message: 'Invalid date of birth' }
    ),
    
    gender: z.enum(['male', 'female', 'other'], {
        errorMap: () => ({ message: 'Invalid gender selection' })
    }),
    
    phone: iraqiPhoneSchema,
    
    address: z.string()
        .max(200, 'Address must be less than 200 characters')
        .optional(),
    
    emergencyContactName: z.string()
        .max(50, 'Emergency contact name must be less than 50 characters')
        .optional(),
    
    emergencyContactPhone: iraqiPhoneSchema.optional()
});

export const doctorSchema = baseUserSchema.extend({
    specialty: z.string()
        .min(2, 'Specialty must be at least 2 characters')
        .max(50, 'Specialty must be less than 50 characters'),
    
    serviceTypeId: z.number()
        .int('Service type ID must be an integer')
        .positive('Invalid service type ID'),
    
    licenseNumber: z.string()
        .min(3, 'License number must be at least 3 characters')
        .max(20, 'License number must be less than 20 characters'),
    
    experienceYears: z.number()
        .int('Experience years must be a whole number')
        .min(0, 'Experience years cannot be negative')
        .max(70, 'Experience years cannot exceed 70'),
    
    qualifications: z.string()
        .max(500, 'Qualifications must be less than 500 characters')
        .optional(),
    
    consultationFee: z.number()
        .positive('Consultation fee must be positive')
        .max(1000000, 'Consultation fee is unrealistically high')
});