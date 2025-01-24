// src/routes/api/providers/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Ensure user is authenticated
    const userId = locals.user?.id;
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Handle multipart form data
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    
    // Handle the profile picture file
    const profilePicture = formData.get('profilePicture') as File;
    let profilePictureUrl = '';
    
    if (profilePicture) {
      // Here you would typically:
      // 1. Check file type
      if (!profilePicture.type.startsWith('image/')) {
        return new Response('Invalid file type. Please upload an image.', { status: 400 });
      }
      
      // 2. Check file size (e.g., 5MB limit)
      if (profilePicture.size > 5 * 1024 * 1024) {
        return new Response('File too large. Maximum size is 5MB.', { status: 400 });
      }
      
      // 3. Upload to your storage service (e.g., S3, Cloudinary, etc.)
      // This is a placeholder - implement your file upload logic here
      // profilePictureUrl = await uploadToStorage(profilePicture);
      profilePictureUrl = '/placeholder-url.jpg'; // Replace with actual upload
    }

    // Validate required fields
    if (!data.serviceTypeId || !data.qualifications || !data.bio || !data.hourlyRate) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Create provider record
    const provider = {
      userId,
      serviceTypeId: data.serviceTypeId,
      experienceYears: data.experienceYears,
      qualifications: data.qualifications,
      bio: data.bio,
      profilePictureUrl: data.profilePictureUrl,
      hourlyRate: data.hourlyRate,
      rating: 0, // Default rating for new providers
      isVerified: false, // Providers need to be verified by admin
      isAvailable: true, // Default to available
      status: 'pending', // Initial status
      latitude: data.latitude,
      longitude: data.longitude,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Here you would typically save to your database
    // const result = await db.homeCareProvider.create({ data: provider });

    return json({ success: true, provider });
  } catch (error) {
    console.error('Provider registration error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};