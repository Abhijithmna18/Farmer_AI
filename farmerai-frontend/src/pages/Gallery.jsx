import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HomeButton from '../components/HomeButton';
import { glass } from '../styles/globalStyles';
import apiClient from '../services/apiClient';

// GalleryCard Component
const GalleryCard = ({ item, onClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <motion.div
      className={`${glass.card} relative group cursor-pointer overflow-hidden rounded-xl`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      onClick={() => onClick(item)}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-2 text-center">
          <div className="text-2xl mb-1">📷</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">Image unavailable</div>
        </div>
      )}
      
      <img
        src={item.image?.url || item.src}
        alt={item.image?.alt || item.alt}
        className={`w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white text-center"
        >
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-sm">View</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ImageModal Component
const ImageModal = ({ item, onClose, onNext, onPrev }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!item) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose} // Close when clicking outside the image
    >
      <motion.div
        className="relative bg-gray-800 p-4 rounded-lg shadow-xl max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-2xl p-2 rounded-full bg-gray-700 hover:bg-gray-600 z-10"
          aria-label="Close image modal"
        >
          &times;
        </button>
        
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-10 p-4 text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-gray-300">Unable to load image</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Close
            </button>
          </div>
        )}
        
        <img 
          src={item.image?.url || item.src} 
          alt={item.image?.alt || item.alt} 
          className={`max-w-full max-h-[70vh] object-contain mx-auto rounded-md ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
        <div className="text-center mt-4">
          <h3 className="text-xl font-semibold text-white">{item.title}</h3>
          {item.description && <p className="text-gray-300 text-sm mt-1">{item.description}</p>}
          {item.category && (
            <div className="mt-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {item.category}
              </span>
            </div>
          )}
        </div>
        <div className="absolute inset-y-0 left-0 flex items-center">
          <button
            onClick={onPrev}
            className="bg-gray-700 bg-opacity-75 text-white p-3 rounded-r-lg hover:bg-opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            &lt;
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            onClick={onNext}
            className="bg-gray-700 bg-opacity-75 text-white p-3 rounded-l-lg hover:bg-opacity-100 transition-opacity"
            aria-label="Next image"
          >
            &gt;
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // Fallback static data
  const fallbackItems = [
    { id: 1, src: "/farm.jpg", title: "Soil Testing", description: "AI-powered soil analysis for optimal crop growth.", alt: "Soil being tested", category: "farm" },
    { id: 2, src: "/image.png", title: "Healthy Crops", description: "Vibrant crops thriving with FarmerAI recommendations.", alt: "Healthy crops in a field", category: "crops" },
    { id: 3, src: "/Community Event.png", title: "Community Event", description: "Farmers gathering at a local FarmerAI workshop.", alt: "Farmers at a community event", category: "events" },
    { id: 4, src: "/Planting Tutorial.png", title: "Planting Tutorial", description: "Step-by-step guide on efficient planting techniques.", alt: "Hands planting a seedling", category: "tutorials" },
    { id: 5, src: "/New Crop Variety.png", title: "New Crop Variety", description: "Introducing a drought-resistant crop for arid regions.", alt: "New crop variety", category: "crops" },
    { id: 6, src: "/Clay Soil.png", title: "Clay Soil", description: "Understanding the properties of clay soil for better management.", alt: "Close-up of clay soil", category: "soil" },
    { id: 7, src: "/Harvest Festival.png", title: "Harvest Festival", description: "Celebrating a bountiful harvest with the FarmerAI community.", alt: "Harvest festival celebration", category: "events" },
    { id: 8, src: "/Irrigation Setup.png", title: "Irrigation Setup", description: "Setting up an automated irrigation system.", alt: "Irrigation system in a field", category: "equipment" },
  ];

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/gallery?isActive=true&limit=20');
      const items = response.data?.data || response.data || [];
      setGalleryItems(items);
    } catch (err) {
      console.error('Error fetching gallery items:', err);
      setError('Failed to load gallery items. Showing fallback content.');
      setGalleryItems(fallbackItems);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item) => {
    setSelectedImage(item);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const goToNext = () => {
    const currentIndex = galleryItems.findIndex(item => (item._id || item.id) === (selectedImage._id || selectedImage.id));
    const nextIndex = (currentIndex + 1) % galleryItems.length;
    setSelectedImage(galleryItems[nextIndex]);
  };

  const goToPrev = () => {
    const currentIndex = galleryItems.findIndex(item => (item._id || item.id) === (selectedImage._id || selectedImage.id));
    const prevIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    setSelectedImage(galleryItems[prevIndex]);
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImage) {
        if (e.key === 'Escape') {
          closeModal();
        } else if (e.key === 'ArrowRight') {
          goToNext();
        } else if (e.key === 'ArrowLeft') {
          goToPrev();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage]);

  if (loading) {
    return (
      <motion.div
        className="bg-gray-50 min-h-screen text-gray-800 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-gray-50 min-h-screen text-gray-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <HomeButton />
      {/* Hero Section */}
      <header className="relative bg-green-600 text-white text-center py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-30 z-0"></div> {/* Glass overlay effect */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold">Gallery</h1>
          <p className="text-xl mt-4">Explore farming snapshots, tutorials, and event highlights</p>
          {error && (
            <div className="mt-4 text-yellow-200 text-sm">
              {error}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {galleryItems.map((item) => (
            <GalleryCard key={item._id || item.id} item={item} onClick={openModal} />
          ))}
        </div>
      </main>

      {selectedImage && (
        <ImageModal
          item={selectedImage}
          onClose={closeModal}
          onNext={goToNext}
          onPrev={goToPrev}
        />
      )}
    </motion.div>
  );
};

export default Gallery;