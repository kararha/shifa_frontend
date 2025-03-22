// src/routes/api/providers/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { API_BASE_URL } from '$lib/config';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    
    // First handle the profile picture upload
    const profilePicture = formData.get('profile_picture') as File;
    let profilePictureUrl = '';

    if (profilePicture && profilePicture.size > 0) {
      const imageFormData = new FormData();
      imageFormData.append('file', profilePicture);
      imageFormData.append('directory', 'profile_images'); // Specify the upload directory

      const uploadResponse = await fetch(`${API_BASE_URL}/api/uploads`, {
        method: 'POST',
        body: imageFormData
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        profilePictureUrl = uploadResult.url;
      }
    }

    // Create registration data
    const registrationData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (key !== 'profile_picture') {
        registrationData.append(key, value);
      }
    }
    if (profilePictureUrl) {
      registrationData.append('profile_picture_url', profilePictureUrl);
    }

    // Send registration data
    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: registrationData
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.error('Registration failed:', errorText);
      return new Response(errorText, { status: registerResponse.status });
    }

    const result = await registerResponse.json();
    return json({
      success: true,
      user: result.user,
      token: result.token,
      profile_picture_url: profilePictureUrl
    });

  } catch (error) {
    console.error('Registration error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchQuery = url.searchParams.get('q') || '';
    console.log('Fetching providers with query:', searchQuery);

    const response = await fetch(`${API_BASE_URL}/api/providers${searchQuery ? `?q=${searchQuery}` : ''}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} - ${responseText}`);
    }

    let providers;
    try {
      providers = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error('Invalid JSON response from server');
    }

    if (!Array.isArray(providers)) {
      console.warn('Expected array response, got:', typeof providers);
      providers = [];
    }

    return json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return json({ 
      error: 'Failed to load providers',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
};