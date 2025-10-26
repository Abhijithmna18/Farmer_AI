import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import { generateEmbedUrl, getVideoThumbnailUrl } from '../utils/youtubeUtils';
import useAuth from '../hooks/useAuth';

const WorkshopVideo = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Check authentication first
    if (!authLoading) {
      if (!user) {
        // User not authenticated, redirect to login
        nav('/login');
        return;
      }
      
      // User is authenticated, proceed with workshop access check
      fetchWorkshop();
      checkAccess();
    }
  }, [user, authLoading, id]);

  const fetchWorkshop = async () => {
    try {
      setLoading(true);
      const response = await workshopService.getWorkshopById(id);
      setWorkshop(response.data.data);
    } catch (err) {
      setError('Failed to fetch workshop details');
      console.error('Error fetching workshop:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = async () => {
    try {
      const response = await workshopService.checkWorkshopAccess(id);
      setHasAccess(response.data.hasAccess);
      
      // If no access, redirect to detail page
      if (!response.data.hasAccess) {
        nav(`/workshops/${id}`);
      }
    } catch (err) {
      console.error('Error checking access:', err);
      nav(`/workshops/${id}`);
    }
  };

  // Show loading while checking authentication or workshop data
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white">Loading workshop...</p>
        </div>
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6 bg-gray-800 rounded-lg max-w-md">
          <p className="text-red-400 mb-4">{error || 'Workshop not found'}</p>
          <button
            onClick={() => nav(`/workshops/${id}`)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Go to Workshop Details
          </button>
        </div>
      </div>
    );
  }

  // Generate embed URL using YouTube utilities
  const embedUrl = generateEmbedUrl(workshop.videoUrl, {
    autoplay: 1,
    rel: 0,
    modestbranding: 1,
    showinfo: 0,
    controls: 1
  });

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <button
          onClick={() => nav(`/workshops/${id}`)}
          className="flex items-center hover:text-green-400 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Workshop
        </button>
        <h1 className="text-lg font-semibold truncate mx-4">{workshop.title}</h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      {/* Video Player */}
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden">
          {embedUrl ? (
            // Check if it's a direct video URL
            embedUrl.match(/\.(mp4|webm|ogg)$/i) ? (
              <video 
                src={embedUrl} 
                controls 
                autoPlay 
                className="w-full h-full"
                onError={(e) => {
                  console.error('Video playback error:', e);
                  e.target.style.display = 'none';
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe
                src={embedUrl}
                title={workshop.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={(e) => {
                  console.error('Embed error:', e);
                }}
              ></iframe>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p>Video not available</p>
            </div>
          )}
        </div>

        {/* Workshop Info */}
        <div className="w-full max-w-6xl mt-6 bg-gray-800 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">{workshop.title}</h2>
          <p className="text-gray-300 mb-4">{workshop.description}</p>
          
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{workshop.duration} minutes</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{workshop.instructor.name}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{workshop.level} Level</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopVideo;