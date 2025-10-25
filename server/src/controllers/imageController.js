import { createClient } from '@supabase/supabase-js';
import https from 'https';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-service-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-exp';

/**
 * Helper function to make HTTP requests
 */
const makeHttpRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve({ ok: true, data: jsonData, status: res.statusCode });
          } catch (e) {
            resolve({ ok: true, data: data, status: res.statusCode });
          }
        } else {
          reject({ ok: false, status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject({ ok: false, error: error.message });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
};

/**
 * Generate AI image using Google Gemini
 */
export const generateAIImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: { message: 'Prompt is required and must be a string' }
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: { message: 'Gemini API key not configured. Add GEMINI_API_KEY to your .env file' }
      });
    }

    // Generate image using Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const enhancedPrompt = `Generate a professional profile picture: ${prompt}. Style: centered composition, high quality, detailed portrait photography, professional headshot`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: enhancedPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    console.log('Calling Gemini API...');
    const response = await makeHttpRequest(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response);
      
      // Check for quota exceeded error
      if (response.status === 429) {
        return res.status(429).json({
          error: { 
            message: 'API quota exceeded. Please try again later or upgrade your plan.',
            details: response.data
          }
        });
      }
      
      return res.status(response.status || 500).json({
        error: { 
          message: 'Failed to generate image',
          details: response.data
        }
      });
    }

    const data = response.data;
    
    // Extract text response from Gemini
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      return res.status(500).json({
        error: { message: 'No response generated from Gemini' }
      });
    }

    // For now, return a placeholder image URL since Gemini doesn't generate actual images
    // You can integrate with another service to convert the description to an image
    const placeholderImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(prompt)}`;

    console.log('Gemini response received, using placeholder image');

    res.json({
      success: true,
      data: {
        imageUrl: placeholderImageUrl,
        prompt,
        generatedDescription: generatedText,
        isBase64: false,
        note: 'Using placeholder avatar since Gemini is text-only. Generated description is included.'
      }
    });

  } catch (error) {
    console.error('Generate AI image error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', details: error.message }
    });
  }
};

/**
 * Upload generated image to Supabase storage
 */
export const uploadImageToSupabase = async (req, res) => {
  try {
    const { imageUrl, userId } = req.body;

    if (!imageUrl || !userId) {
      return res.status(400).json({
        error: { message: 'Image URL and user ID are required' }
      });
    }

    let buffer;

    // Check if image is base64 data URL (from Gemini)
    if (imageUrl.startsWith('data:image/')) {
      // Extract base64 data
      const base64Data = imageUrl.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      // Download the image from URL using https module
      const response = await makeHttpRequest(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to download image');
      }
      buffer = Buffer.from(response.data, 'binary');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `profile-pictures/${userId}-${timestamp}.png`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars') // Bucket name - create this in Supabase if it doesn't exist
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({
        error: { message: 'Failed to upload image to storage', details: uploadError }
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    res.json({
      success: true,
      data: {
        url: publicUrl,
        path: filename,
      }
    });

  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      error: { message: 'Internal server error', details: error.message }
    });
  }
};

/**
 * Combined endpoint: Generate and save AI image
 */
export const generateAndSaveImage = async (req, res) => {
  try {
    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({
        error: { message: 'Prompt and user ID are required' }
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: { message: 'Gemini API key not configured' }
      });
    }

    // Step 1: Generate image description with Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const enhancedPrompt = `Generate a professional profile picture: ${prompt}. Style: centered composition, high quality, detailed portrait photography, professional headshot`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: enhancedPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    const response = await makeHttpRequest(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({
          error: { message: 'API quota exceeded. Please try again later.' }
        });
      }
      return res.status(response.status || 500).json({
        error: { message: 'Failed to generate image description' }
      });
    }

    // Generate placeholder avatar based on prompt
    const placeholderImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(prompt)}`;

    // Step 2: Download placeholder image
    const imageResponse = await makeHttpRequest(placeholderImageUrl);
    const buffer = Buffer.from(imageResponse.data);

    const timestamp = Date.now();
    const filename = `profile-pictures/${userId}-${timestamp}.svg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, buffer, {
        contentType: 'image/svg+xml',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({
        error: { message: 'Failed to save image', details: uploadError }
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    res.json({
      success: true,
      data: {
        imageUrl: publicUrl,
        path: filename,
        prompt,
        note: 'Using placeholder avatar since Gemini is text-only'
      }
    });

  } catch (error) {
    console.error('Generate and save image error:', error);
    res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
};
