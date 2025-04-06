// Re-export components and functionality from the doctors route
export { default as DoctorsPage } from './+page.svelte';

// Export types and interfaces if needed
export interface Doctor {
    id: string;
    name: string;
    specialization: string;
    // Add other relevant fields
}

// Export any utilities or helpers specific to doctors
export * from './dashboard';